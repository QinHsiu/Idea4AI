import { NextResponse } from "next/server";
import { memoryStore } from "@/store/memory";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const idea = memoryStore.getIdea(id);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }
  const run = memoryStore.getLatestRun(id);
  return NextResponse.json({
    idea,
    run: run
      ? {
          run_id: run.run_id,
          status: run.status,
          error: run.error ?? null,
          verdict: run.report?.verdict.verdict ?? null,
          composite: run.report?.scorecard.composite ?? null,
        }
      : null,
    report: run?.status === "completed" ? run.report ?? null : null,
  });
}
