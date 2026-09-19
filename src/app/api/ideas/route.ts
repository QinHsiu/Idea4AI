import { NextResponse } from "next/server";
import { getStore } from "@/store";

export async function GET() {
  const store = getStore();
  const ideas = await store.listIdeas();
  const rows = await Promise.all(
    ideas.map(async (idea) => {
      const run = await store.getLatestRun(idea.id);
      return {
        id: idea.id,
        text: idea.text,
        created_at: idea.created_at,
        status: run?.status ?? "draft",
        verdict: run?.report?.verdict.verdict ?? null,
        composite: run?.report?.scorecard.composite ?? null,
      };
    }),
  );
  return NextResponse.json({ ideas: rows, backend: store.backend });
}

export async function POST(request: Request) {
  let body: unknown;
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

  const store = getStore();
  const created = await store.createIdea(text);
  return NextResponse.json(
    { ...created, backend: store.backend },
    { status: 201 },
  );
}
