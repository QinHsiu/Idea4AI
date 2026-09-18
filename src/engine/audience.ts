import { audienceProfileSchema, type AudienceProfile, type ClarifiedIdea } from "./schemas";
import type { IdeaInput } from "./clarify";

export function audience(input: IdeaInput, clarified: ClarifiedIdea): AudienceProfile {
  const persona = clarified.who || "the target user";
  const result = {
    primary: {
      persona,
      context: clarified.pain,
      reachability: "mid" as const,
      notes: `Start with communities and channels where ${persona} already gathers.`,
    },
    non_audience: ["users without the stated problem", "large enterprises without a focused use case"],
  };
  void input;
  return audienceProfileSchema.parse(result);
}
