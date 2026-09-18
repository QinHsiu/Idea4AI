import { clarifiedIdeaSchema, type ClarifiedIdea } from "./schemas";

export interface IdeaInput {
  idea_text: string;
  idea_id?: string;
}

/** Turn raw idea text into the small, stable P0 clarification contract. */
export function clarify(input: IdeaInput): ClarifiedIdea {
  const text = input.idea_text.trim();
  if (!text) {
    throw new Error("IDEA_TEXT_REQUIRED");
  }

  const generic = /\b(everyone|anything|everything|ai[- ]powered|ai app)\b/i.test(text);
  const whoMatch = text.match(/\bfor\s+(.+?)(?:\s+(?:that|who|to)\b|$)/i);
  const who = whoMatch?.[1]?.trim() || (generic ? "a broad general audience" : "the people with this problem");
  const oneLiner = text.replace(/\s+/g, " ").slice(0, 160);
  const result = {
    who,
    pain: generic ? "an insufficiently specific problem to validate" : `the problem described by: ${oneLiner}`,
    artifact: "a focused product or workflow",
    why_now: "faster prototyping makes validation timely",
    one_liner: oneLiner,
    assumptions: generic
      ? ["a specific user has this problem", "the problem is painful enough to solve"]
      : ["the stated audience experiences the problem", "a focused solution can improve the current workflow"],
    low_specificity: generic || text.split(/\s+/).length < 4,
  };
  return clarifiedIdeaSchema.parse(result);
}
