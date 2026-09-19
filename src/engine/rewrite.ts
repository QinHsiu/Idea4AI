import type { AudienceProfile, ClarifiedIdea } from "./schemas";

/**
 * Up to 3 sharper one-liner rewrites (TweakIdea absorb).
 * Call only when require_rewrite / template_hit.
 */
export function rewriteSuggestions(
  ideaText: string,
  clarified: ClarifiedIdea,
  audience: AudienceProfile,
): string[] {
  const who =
    audience.primary.persona ||
    clarified.who ||
    "a specific professional niche";
  const pain =
    clarified.low_specificity || /uncertain|insufficiently specific/i.test(clarified.pain)
      ? "a measurable weekly pain (time, money, or risk)"
      : clarified.pain;
  const artifact = clarified.artifact || "a focused workflow tool";
  const base = ideaText.replace(/\s+/g, " ").trim().slice(0, 80);

  return [
    `For ${who}: ${artifact} that solves ${pain} in under one week.`,
    `Narrow wedge: help ${who} validate ${pain} before writing production code — not a generic AI app.`,
    `Rewrite of “${base || clarified.one_liner}”: pick one channel (${audience.primary.context || "where they already hang out"}) and one success metric.`,
  ].slice(0, 3);
}
