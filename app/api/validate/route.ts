import { NextRequest, NextResponse } from "next/server";
import { validateBatch } from "@/lib/validate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_type, raw_text } = body;

    if (!task_type || typeof raw_text !== "string") {
      return NextResponse.json({ valid: false, lines: [] }, { status: 400 });
    }

    const result = validateBatch(task_type, raw_text);

    return NextResponse.json({
      valid: result.valid,
      lines: result.lines,
      tooManyLines: result.lines.length > 10
    });
  } catch (e: any) {
    return NextResponse.json({ valid: false, lines: [] }, { status: 400 });
  }
}
