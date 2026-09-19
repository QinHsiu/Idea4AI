import {
  pestleLiteSchema,
  type ClarifiedIdea,
  type NoveltyResult,
  type PestleLite,
  type ScorecardResult,
  type VerdictResult,
} from "./schemas";

/** PESTLE lite for vibe-coding / AI tooling context. */
export function pestleLite(input: {
  clarified: ClarifiedIdea;
  novelty: NoveltyResult;
  scorecard: ScorecardResult;
  verdict: VerdictResult;
}): PestleLite {
  const { clarified, novelty, scorecard, verdict } = input;
  return pestleLiteSchema.parse({
    political:
      "Export controls and AI policy can change model access/cost; keep vendor flexibility.",
    economic: `Willingness ${scorecard.dimensions.Willingness}/100 — price probes must stay cheap; verdict ${verdict.verdict} implies ${
      verdict.verdict === "build" ? "invest carefully in MVP" : "minimize burn until evidence"
    }.`,
    social: `${clarified.who} adopt tools via communities and peer proof; trust > hype for ${clarified.pain}.`,
    technological: novelty.template_hit
      ? "Generic AI wrappers commoditize fast — differentiate on workflow depth and data."
      : `Feasible with current LLM/tooling (Buildability ${scorecard.dimensions.Buildability}).`,
    legal:
      "Respect user data, scraped evidence licenses, and marketplace ToS if integrating third-party APIs.",
    environmental:
      "Model inference has energy cost — prefer smaller models / caching for validation loops.",
  });
}
