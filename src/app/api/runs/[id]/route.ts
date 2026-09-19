import { NextResponse } from "next/server";
import { getStore } from "@/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const store = getStore();
  const { id } = await context.params;
  const run = await store.getRun(id);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  return NextResponse.json(run);
}
