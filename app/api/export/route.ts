import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const task_type = searchParams.get("task");

    if (!task_type || !["marketing", "regulasi", "bmc", "convertation"].includes(task_type)) {
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

    const jsonlLines = datasets.map(row => {
      if (task_type === "bmc") {
        let parsedOutput: any = row.output;
        try { parsedOutput = JSON.parse(row.output); } catch {}
        return JSON.stringify({
          tipe: "JSON",
          system: row.system,
          instruction: row.instruction,
          input: row.input,
          output: parsedOutput
        });
      } else if (task_type === "convertation") {
        let conversations: any = row.output;
        try { conversations = JSON.parse(row.output); } catch {}
        return JSON.stringify({
          tipe: "CONV",
          system: row.system,
          conversations
        });
      }
      return JSON.stringify(row);
    }).join("\n");

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
