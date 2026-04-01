import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_TASK_TYPES = ["marketing", "regulasi", "bmc", "convertation"];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const task_type = searchParams.get("task_type");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!task_type || !VALID_TASK_TYPES.includes(task_type)) {
      return NextResponse.json({ error: "Invalid task_type" }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.dataset.findMany({
        where: { taskType: task_type },
        select: { id: true, tipe: true, system: true, instruction: true, input: true, output: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.dataset.count({ where: { taskType: task_type } }),
    ]);

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const result = await prisma.dataset.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
