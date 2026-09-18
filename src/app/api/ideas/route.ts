import { NextResponse } from "next/server";
import { memoryStore } from "@/store/memory";

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
