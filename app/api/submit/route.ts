import { NextRequest, NextResponse } from "next/server";
import { validateBatch, generateHash } from "@/lib/validate";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_type, raw_text, contributor } = body;

    if (!task_type || typeof raw_text !== "string") {
      return NextResponse.json({ success: false, error: "Invalid request format" }, { status: 400 });
    }

    const validationResult = validateBatch(task_type, raw_text);

    if (!validationResult.valid) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed on some rows or exceeded 10 lines limit"
      }, { status: 400 });
    }

    const batchId = randomUUID();
    const insertData = validationResult.lines.map(row => ({
      taskType: task_type,
      system: row.parsed!.system,
      instruction: row.parsed!.instruction,
      input: row.parsed!.input,
      output: row.parsed!.output,
      hash: generateHash(row.parsed!.instruction, row.parsed!.input),
      batchId: batchId,
      contributor: contributor || null,
    }));

    // Deduplication check via transaction
    let inserted = 0;
    try {
      await prisma.$transaction(async (tx) => {
        // We ensure no hash exists and insert them
        const existingHashes = await tx.dataset.findMany({
          where: { hash: { in: insertData.map(d => d.hash) } },
          select: { hash: true }
        });

        if (existingHashes.length > 0) {
          throw new Error("Duplicate data found in database");
        }

        const result = await tx.dataset.createMany({
          data: insertData
        });

        inserted = result.count;
      });
    } catch (e: any) {
      if (e.message.includes("Duplicate data found") || e.code === "P2002") {
        return NextResponse.json({ success: false, error: "Duplicate document detected (identical instruction + input)" }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({
      success: true,
      inserted: inserted,
    });
  } catch (e: any) {
    console.error("Submit Error:", e);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
