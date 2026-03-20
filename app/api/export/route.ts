import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const task_type = searchParams.get("task");

    if (!task_type || (task_type !== "marketing" && task_type !== "regulasi" && task_type !== "chatbot")) {
      return new Response("Invalid task type", { status: 400 });
    }

    const datasets = await prisma.dataset.findMany({
      where: { taskType: task_type },
      orderBy: { createdAt: "asc" },
      select: {
        system: true,
        instruction: true,
        input: true,
        output: true
      }
    });

    const jsonlLines = datasets.map(row => JSON.stringify(row)).join("\n");

    return new Response(jsonlLines + (jsonlLines ? "\n" : ""), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="bismate-${task_type}-export.jsonl"`
      }
    });

  } catch (e: any) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
