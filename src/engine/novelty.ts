import {
  noveltyResultSchema,
  type AudienceProfile,
  type ClarifiedIdea,
  type NoveltyResult,
} from "./schemas";
import type { EvidenceAccumulator } from "./evidence";
import type { IdeaInput } from "./clarify";

export function novelty(
  input: IdeaInput,
  clarified: ClarifiedIdea,
  audienceProfile: AudienceProfile,
  acc: EvidenceAccumulator,
): NoveltyResult {
  const templateHit =
    clarified.low_specificity ||
    /\b(ai|artificial intelligence)\b.*\b(app|tool|platform|solution)\b/i.test(
      input.idea_text,
    );
  if (templateHit) {
    acc.add({
      claim: "The idea resembles a broad, crowded product template.",
      grade: "L0",
    });
  }
  return noveltyResultSchema.parse({
    veto: templateHit,
    reason: templateHit ? "The idea needs a narrower user, pain, or wedge." : undefined,
    template_hit: templateHit,
    collision_hints: [],
    require_rewrite: templateHit,
  });
}
