import { NextResponse } from "next/server";
import { memoryStore } from "@/store/memory";
import type { FixtureName } from "@/engine/mock/selectFixture";

const fixtures = new Set<FixtureName>(["kill", "test", "build"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // An empty body is valid; fixture can be supplied by query/header.
  }

  const bodyFixture =
    typeof body === "object" &&
    body !== null &&
    "fixture" in body &&
    typeof body.fixture === "string"
      ? body.fixture
      : undefined;
  const fixtureValue =
    request.headers.get("x-mock-fixture") ??
    url.searchParams.get("fixture") ??
    bodyFixture;
  if (fixtureValue !== undefined && !fixtures.has(fixtureValue as FixtureName)) {
    return NextResponse.json(
      { error: "fixture must be kill, test, or build" },
      { status: 400 },
    );
  }

  try {
    const { run_id } = memoryStore.startValidate(
      id,
      fixtureValue as FixtureName | undefined,
    );
    await memoryStore.waitForRun(run_id);
    const run = memoryStore.getRun(run_id);
    return NextResponse.json(
      {
        run_id,
        status: run?.status ?? "unknown",
        report: run?.report ?? null,
        error: run?.error ?? null,
      },
      { status: run?.status === "failed" ? 500 : 200 },
    );
  } catch {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }
}
