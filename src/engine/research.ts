import { z } from "zod";
import {
  researchLiteSchema,
  type AudienceProfile,
  type ClarifiedIdea,
  type NoveltyResult,
  type ResearchLite,
  type ScorecardResult,
  type VerdictResult,
} from "./schemas";
import { chatJson, resolveLlmMode } from "./llm/provider";

export function isDeepResearchLlmEnabled(): boolean {
  return process.env.ENABLE_DEEP_RESEARCH === "1";
}

function heuristicResearch(input: {
  ideaText: string;
  clarified: ClarifiedIdea;
  audience: AudienceProfile;
  novelty: NoveltyResult;
  scorecard: ScorecardResult;
  verdict: VerdictResult;
}): ResearchLite {
  const { clarified, audience, novelty, scorecard, verdict } = input;
  const findings: string[] = [];

  findings.push(
    `Audience: ${audience.primary.persona} (${audience.primary.reachability}) — ${audience.primary.context}`,
  );
  findings.push(
    `Scorecard composite ${scorecard.composite}; Pain ${scorecard.dimensions.Pain}, Differentiation ${scorecard.dimensions.Differentiation}`,
  );
  if (novelty.collision_hints.length) {
    findings.push(
      `${novelty.collision_hints.length} public collision hint(s) from live/mock sources`,
    );
  } else {
    findings.push("No public collision hints on this run — treat novelty as provisional");
  }
  if (novelty.require_rewrite) {
    findings.push("Rewrite required before claiming a differentiated wedge");
  }
  findings.push(`Current verdict ${verdict.verdict}${verdict.caps_applied.length ? ` (caps: ${verdict.caps_applied.join(", ")})` : ""}`);

  const sources = novelty.collision_hints.slice(0, 6).map((h) => ({
    title: h.title,
    url: h.url,
    source: h.source,
  }));

  const confidence = Math.max(
    15,
    Math.min(
      90,
      Math.round(
        scorecard.composite * 0.5 +
          (novelty.collision_hints.length ? 20 : 0) +
          (clarified.low_specificity ? -15 : 10),
      ),
    ),
  );

  const summary = [
    `Research snapshot for “${clarified.one_liner}”.`,
    `Primary job: help ${clarified.who} with ${clarified.pain} via ${clarified.artifact}.`,
    novelty.veto
      ? "Public/template signals suggest the space is crowded — narrow before building."
      : `Signals lean ${verdict.verdict}; validate willingness and distribution next.`,
  ].join(" ");

  return researchLiteSchema.parse({
    summary,
    findings: findings.slice(0, 5),
    sources,
    confidence,
    mode: "heuristic",
  });
}

const llmResearchSchema = z.object({
  summary: z.string(),
  findings: z.array(z.string()).max(5),
});

/** ai-research-platform absorb: structured research brief (heuristic, optional LLM). */
export async function researchLite(input: {
  ideaText: string;
  clarified: ClarifiedIdea;
  audience: AudienceProfile;
  novelty: NoveltyResult;
  scorecard: ScorecardResult;
  verdict: VerdictResult;
}): Promise<ResearchLite> {
  const base = heuristicResearch(input);
  const mode = resolveLlmMode();
  if (
    !isDeepResearchLlmEnabled() ||
    (mode !== "openai" && mode !== "anthropic")
  ) {
    return base;
  }

  try {
    const raw = await chatJson(
      `Deep-research brief for a vibe-coding idea. Return JSON:
{"summary":"2-4 sentences","findings":["up to 5 short bullets"]}

Idea: """${input.ideaText}"""
Clarified: ${JSON.stringify(input.clarified)}
Verdict: ${input.verdict.verdict}
Composite: ${input.scorecard.composite}
Collisions: ${JSON.stringify(input.novelty.collision_hints.slice(0, 4))}
Heuristic summary: ${base.summary}`,
    );
    const parsed = llmResearchSchema.parse(raw);
    return researchLiteSchema.parse({
      ...base,
      summary: parsed.summary,
      findings: parsed.findings.slice(0, 5),
      mode: "llm",
      confidence: Math.min(95, base.confidence + 10),
    });
  } catch {
    return base;
  }
}

/** Short investor-style pitch from clarified + verdict. */
export function pitchLite(
  clarified: ClarifiedIdea,
  verdict: VerdictResult,
  research: ResearchLite,
): string {
  return `${clarified.one_liner} — for ${clarified.who}. Why now: ${clarified.why_now}. Verdict: ${verdict.verdict} (research confidence ${research.confidence}%).`;
}
