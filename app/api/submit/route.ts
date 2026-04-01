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
        error: "Validation failed on some rows or exceeded 10 lines limit",
      }, { status: 400 });
    }

    const batchId = randomUUID();
    const insertData = validationResult.lines.map(row => {
      const parsed = row.parsed!;

      // CONV types (bmc CONV, convertation CONV): flatten conversations into output field
      if (parsed.tipe === "CONV") {
        const conversations = parsed.conversations!;
        const firstUserMsg = conversations.find(c => c.role === "user")?.content ?? "";
        const conversationsJson = JSON.stringify(conversations);
        return {
          taskType: task_type,
          tipe: "CONV",
          system: parsed.system,
          instruction: "",
          input: firstUserMsg,
          output: conversationsJson,
          hash: generateHash("CONV", conversationsJson),
          batchId,
          contributor: contributor || null,
        };
      }

      // All other types (marketing, regulasi, bmc JSON, convertation JSON)
      const output = typeof parsed.output === "object"
        ? JSON.stringify(parsed.output)
        : parsed.output as string;

      return {
        taskType: task_type,
        tipe: parsed.tipe || null,
        system: parsed.system,
        instruction: parsed.instruction,
        input: parsed.input,
        output,
        hash: generateHash(parsed.instruction, parsed.input),
        batchId,
        contributor: contributor || null,
      };
    });

    let inserted = 0;
    try {
      await prisma.$transaction(async (tx) => {
        const existingHashes = await tx.dataset.findMany({
          where: { hash: { in: insertData.map(d => d.hash) } },
          select: { hash: true },
        });

        if (existingHashes.length > 0) {
          throw new Error("Duplicate data found in database");
        }

        const result = await tx.dataset.createMany({ data: insertData });
        inserted = result.count;
      });
    } catch (e: any) {
      if (e.message.includes("Duplicate data found") || e.code === "P2002") {
        return NextResponse.json({ success: false, error: "Duplicate document detected" }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({ success: true, inserted });
  } catch (e: any) {
    console.error("Submit Error:", e);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
