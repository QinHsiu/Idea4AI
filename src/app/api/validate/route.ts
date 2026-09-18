import { NextResponse } from "next/server";
import { memoryStore } from "@/store/memory";
import type { FixtureName } from "@/engine/mock/selectFixture";

const fixtures = new Set<FixtureName>(["kill", "test", "build"]);

/** Atomic create + validate (avoids multi-instance memory gaps in Next.js). */
export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "text" in body &&
    typeof body.text === "string"
      ? body.text.trim()
      : "";
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const fixtureRaw =
    typeof body === "object" &&
    body !== null &&
    "fixture" in body &&
    typeof body.fixture === "string"
      ? body.fixture
      : undefined;
  if (fixtureRaw !== undefined && !fixtures.has(fixtureRaw as FixtureName)) {
    return NextResponse.json(
      { error: "fixture must be kill, test, or build" },
      { status: 400 },
    );
  }

  const { id } = memoryStore.createIdea(text);
  const { run_id } = memoryStore.startValidate(
    id,
    fixtureRaw as FixtureName | undefined,
  );
  await memoryStore.waitForRun(run_id);
  const run = memoryStore.getRun(run_id);
  if (!run || run.status === "failed") {
    return NextResponse.json(
      { error: run?.error ?? "Validate failed", idea_id: id, run_id },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      idea_id: id,
      run_id,
      status: run.status,
      report: run.report ?? null,
    },
    { status: 200 },
  );
}
