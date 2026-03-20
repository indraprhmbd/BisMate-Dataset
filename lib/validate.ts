import crypto from "crypto";

export type TaskType = "marketing" | "regulasi";

export interface DatasetRow {
  system: string;
  instruction: string;
  input: string;
  output: string;
}

export interface LineValidation {
  line: number;
  originalText: string;
  isValid: boolean;
  error?: string;
  parsed?: DatasetRow;
}

export interface ValidationResult {
  valid: boolean;
  lines: LineValidation[];
}

export function validateFields(obj: any): string | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "Row is not a valid JSON object";

  const required = ["system", "instruction", "input", "output"];
  for (const field of required) {
    if (typeof obj[field] !== "string") {
      return `Missing or invalid field: ${field}`;
    }
    if (obj[field].trim() === "") {
      return `Field cannot be empty: ${field}`;
    }
  }
  return null;
}

export function validateTaskRules(taskType: TaskType, obj: DatasetRow): string | null {
  if (taskType === "marketing") {
    if (!obj.output.includes("Strategi") || !obj.output.includes("Content Calendar")) {
      return 'Marketing output must contain "Strategi" and "Content Calendar"';
    }
  } else if (taskType === "regulasi") {
    if (!obj.input.includes("Konteks:") || !obj.input.includes("Pertanyaan:")) {
      return 'Regulasi input must contain "Konteks:" and "Pertanyaan:"';
    }
  } else {
    return 'Invalid task_type';
  }
  return null;
}

export function generateHash(instruction: string, input: string): string {
  return crypto.createHash("sha256").update(instruction + input).digest("hex");
}

export function validateBatch(taskType: string, rawText: string): ValidationResult {
  if (!rawText.trim()) {
    return { valid: false, lines: [] };
  }

  let lines: string[] = [];

  // Try to parse the entire text as a single JSON array first
  try {
    const parsedObj = JSON.parse(rawText);
    if (Array.isArray(parsedObj)) {
      // If it's a JSON array, map each object back to a JSON string for our line validation logic
      lines = parsedObj.map(obj => JSON.stringify(obj));
    } else {
      // It's a valid JSON but not an array (maybe a single object). 
      // We can just throw and fallback to standard JSONL logic below.
      throw new Error("Not an array"); 
    }
  } catch (e) {
    // Not a valid JSON array, fallback to normal JSONL splitting
    lines = rawText.split("\n");
  }

  const lineResults: LineValidation[] = [];
  let allValid = true;

  for (let i = 0; i < lines.length; i++) {
    const originalText = lines[i].trim();
    if (!originalText) continue;

    let isValid = true;
    let error: string | undefined;
    let parsed: any;

    try {
      parsed = JSON.parse(originalText);
    } catch (e) {
      isValid = false;
      error = "Invalid JSON format";
    }

    if (isValid) {
      const fieldError = validateFields(parsed);
      if (fieldError) {
        isValid = false;
        error = fieldError;
      } else {
        const typedObj = parsed as DatasetRow;
        const ruleError = validateTaskRules(taskType as TaskType, typedObj);
        if (ruleError) {
          isValid = false;
          error = ruleError;
        } else {
          parsed = typedObj;
        }
      }
    }

    lineResults.push({
      line: i + 1,
      originalText,
      isValid,
      error,
      parsed: isValid ? parsed : undefined
    });

    if (!isValid) allValid = false;
  }

  const tooManyLines = lineResults.length > 10;
  if (tooManyLines) allValid = false;

  return {
    valid: allValid && lineResults.length > 0,
    lines: lineResults,
  };
}
