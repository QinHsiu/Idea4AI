import { NextResponse } from "next/server";
import { getStore, isSupabaseConfigured } from "@/store";
import { resolveLlmMode } from "@/engine/llm/provider";
import { isRetrievalEnabled } from "@/engine/retrieval";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    ok: true,
    backend: store.backend,
    supabase_configured: isSupabaseConfigured(),
    llm: resolveLlmMode(),
    retrieval_enabled: isRetrievalEnabled(),
    deep_research_llm: process.env.ENABLE_DEEP_RESEARCH === "1",
    pipeline_version: process.env.PIPELINE_VERSION ?? "p2.0.0",
  });
}
