import { extractJsonObject } from "./provider";

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-latest";

export async function anthropicChatJson(prompt: string): Promise<unknown> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new Error("ANTHROPIC_API_KEY is missing");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      temperature: 0.2,
      system:
        "You are Idea4AI's validation assistant. Reply with a single JSON object only.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Anthropic returned empty content");
  return extractJsonObject(text);
}
