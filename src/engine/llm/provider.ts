export type LlmMode = "mock" | "heuristic" | "openai" | "anthropic";

export function resolveLlmMode(): LlmMode {
  if (process.env.MOCK_LLM !== "0") return "mock";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  return "heuristic";
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("LLM response did not contain JSON object");
  }
}

export async function chatJson(prompt: string): Promise<unknown> {
  const mode = resolveLlmMode();
  if (mode === "openai") {
    const { openaiChatJson } = await import("./openai");
    return openaiChatJson(prompt);
  }
  if (mode === "anthropic") {
    const { anthropicChatJson } = await import("./anthropic");
    return anthropicChatJson(prompt);
  }
  throw new Error(`chatJson is not available in mode=${mode}`);
}
