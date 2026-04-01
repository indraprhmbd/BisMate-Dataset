import crypto from "crypto";

export type TaskType = "marketing" | "regulasi" | "bmc" | "convertation";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface DatasetRow {
  system: string;
  instruction: string;
  input: string;
  output: string | Record<string, unknown>;
  tipe?: string;
  // Only for convertation CONV type
  conversations?: ConversationTurn[];
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

const BMC_REQUIRED_BLOCKS = [
  "customer_segments",
  "value_propositions",
  "channels",
  "customer_relationships",
  "revenue_streams",
  "key_resources",
  "key_activities",
  "key_partnerships",
  "cost_structure",
];

export function validateFields(taskType: string, obj: any): string | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return "Row is not a valid JSON object";

  // convertation CONV type: only needs system + conversations
  if (taskType === "convertation" && obj.tipe === "CONV") {
    if (typeof obj.system !== "string" || obj.system.trim() === "") {
      return "Missing or invalid field: system";
    }
    if (!Array.isArray(obj.conversations) || obj.conversations.length === 0) {
      return "Missing or invalid field: conversations (must be a non-empty array)";
    }
    return null;
  }

  const required = ["system", "instruction", "input", "output"];
  for (const field of required) {
    if (field === "output" && (taskType === "bmc" || taskType === "convertation")) {
      // BMC/convertation JSON output can be an object
      if (obj[field] === undefined || obj[field] === null) {
        return "Missing or invalid field: output";
      }
      if (typeof obj[field] === "string" && obj[field].trim() === "") {
        return "Field cannot be empty: output";
      }
      continue;
    }
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
    if (typeof obj.output !== "string" || !obj.output.includes("Strategi") || !obj.output.includes("Content Calendar")) {
      return 'Marketing output must contain "Strategi" and "Content Calendar"';
    }
  } else if (taskType === "regulasi") {
    if (!obj.input.includes("Konteks:") || !obj.input.includes("Pertanyaan:")) {
      return 'Regulasi input must contain "Konteks:" and "Pertanyaan:"';
    }
  } else if (taskType === "bmc") {
    const tipe = obj.tipe;
    if (!tipe || (tipe !== "CONV" && tipe !== "JSON")) {
      return 'BMC row must have field "tipe" with value "CONV" or "JSON"';
    }
    if (tipe === "JSON") {
      if (typeof obj.output !== "object" || Array.isArray(obj.output)) {
        return 'BMC JSON type: field "output" must be a JSON object';
      }
      for (const block of BMC_REQUIRED_BLOCKS) {
        if (!Array.isArray((obj.output as any)[block])) {
          return `BMC JSON type: output missing required block "${block}"`;
        }
      }
    } else if (tipe === "CONV") {
      if (typeof obj.output !== "string" || obj.output.trim() === "") {
        return 'BMC CONV type: field "output" must be a non-empty string';
      }
    }
  } else if (taskType === "convertation") {
    const tipe = obj.tipe;
    if (!tipe || (tipe !== "CONV" && tipe !== "JSON")) {
      return 'Convertation row must have field "tipe" with value "CONV" or "JSON"';
    }
    if (tipe === "CONV") {
      const convs = obj.conversations;
      if (!Array.isArray(convs) || convs.length < 5) {
        return 'Convertation CONV type: "conversations" must have at least 5 turns';
      }
      for (let i = 0; i < convs.length; i++) {
        const turn = convs[i];
        if (!turn || typeof turn.role !== "string" || typeof turn.content !== "string") {
          return `Convertation CONV type: conversation turn ${i + 1} must have "role" and "content"`;
        }
        if (turn.role !== "user" && turn.role !== "assistant") {
          return `Convertation CONV type: turn ${i + 1} role must be "user" or "assistant"`;
        }
        if (turn.content.trim() === "") {
          return `Convertation CONV type: turn ${i + 1} content cannot be empty`;
        }
      }
    } else if (tipe === "JSON") {
      if (typeof obj.output !== "object" || Array.isArray(obj.output)) {
        return 'Convertation JSON type: field "output" must be a JSON object';
      }
      for (const block of BMC_REQUIRED_BLOCKS) {
        if (!Array.isArray((obj.output as any)[block])) {
          return `Convertation JSON type: output missing required block "${block}"`;
        }
      }
    }
  } else {
    return "Invalid task_type";
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

  try {
    const parsedObj = JSON.parse(rawText);
    if (Array.isArray(parsedObj)) {
      lines = parsedObj.map(obj => JSON.stringify(obj));
    } else {
      throw new Error("Not an array");
    }
  } catch (e) {
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
      const fieldError = validateFields(taskType, parsed);
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
      parsed: isValid ? parsed : undefined,
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
