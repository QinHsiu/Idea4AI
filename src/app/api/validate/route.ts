import { NextResponse } from "next/server";
import { getStore } from "@/store";
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

  const store = getStore();
  const { id } = await store.createIdea(text);
  const { run_id } = await store.startValidate(
    id,
    fixtureRaw as FixtureName | undefined,
  );
  await store.waitForRun(run_id);
  const run = await store.getRun(run_id);
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
      backend: store.backend,
    },
    { status: 200 },
  );
}
