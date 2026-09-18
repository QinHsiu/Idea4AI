import { NextResponse } from "next/server";
import { memoryStore } from "@/store/memory";

export async function GET() {
  const ideas = memoryStore.listIdeas().map((idea) => {
    const run = memoryStore.getLatestRun(idea.id);
    return {
      id: idea.id,
      text: idea.text,
      created_at: idea.created_at,
      status: run?.status ?? "draft",
      verdict: run?.report?.verdict.verdict ?? null,
      composite: run?.report?.scorecard.composite ?? null,
    };
  });
  return NextResponse.json({ ideas });
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

  return NextResponse.json(memoryStore.createIdea(text), { status: 201 });
}
