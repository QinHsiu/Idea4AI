import { NextResponse } from "next/server";
import { getStore } from "@/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const store = getStore();
  const { id } = await context.params;
  const report = await store.getReport(id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json(report);
}
