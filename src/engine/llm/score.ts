import { clarify } from "../clarify";
import { EvidenceAccumulator } from "../evidence";
import { composite, DIMENSIONS } from "../fold";
import {
  clarifiedIdeaSchema,
  scorecardResultSchema,
  type AudienceProfile,
  type ClarifiedIdea,
  type NoveltyResult,
  type ScorecardResult,
} from "../schemas";
import { chatJson, resolveLlmMode } from "./provider";
import { clarifyPrompt, scoreHintsPrompt } from "./enrich";

const DEMAND_KEYS = [
  "demand",
  "pain",
  "competition",
  "funding",
  "urgency",
  "distribution",
] as const;

export async function clarifyWithLlm(ideaText: string): Promise<ClarifiedIdea> {
  if (resolveLlmMode() !== "openai" && resolveLlmMode() !== "anthropic") {
    return clarify({ idea_text: ideaText });
  }
  const raw = await chatJson(clarifyPrompt(ideaText));
  return clarifiedIdeaSchema.parse(raw);
}

export async function scorecardWithLlm(
  ideaText: string,
  clarified: ClarifiedIdea,
  audience: AudienceProfile,
  novelty: NoveltyResult,
  acc: EvidenceAccumulator,
): Promise<{ scorecard: ScorecardResult; next_actions: string[] }> {
  const mode = resolveLlmMode();
  if (mode !== "openai" && mode !== "anthropic") {
    const { scorecard } = await import("../scorecard");
    return {
      scorecard: scorecard(clarified, audience, novelty, acc),
      next_actions: [
        "Interview five target users.",
        "Run a focused validation experiment.",
        "Re-run the validator with the results.",
      ],
    };
  }

  const raw = (await chatJson(
    scoreHintsPrompt(ideaText, JSON.stringify(clarified)),
  )) as {
    demand_signals?: Record<
      string,
      { score?: number | null; confidence?: number; note?: string }
    >;
    dimensions?: Record<string, number>;
    next_actions?: string[];
  };

  const evidenceId = acc.add({
    claim: `LLM (${mode}) assessment for ${audience.primary.persona}: ${clarified.pain}`,
    grade: "L0",
  });

  const demand_signals = Object.fromEntries(
    DEMAND_KEYS.map((key) => {
      const entry = raw.demand_signals?.[key];
      return [
        key,
        {
          score: entry?.score ?? null,
          confidence: entry?.confidence ?? 50,
          evidence_ids: [evidenceId],
        },
      ];
    }),
  );

  const signal_notes = Object.fromEntries(
    DEMAND_KEYS.map((key) => [
      key,
      raw.demand_signals?.[key]?.note ??
        `LLM ${key} assessment; verify with primary sources.`,
    ]),
  );

  const dimensions = Object.fromEntries(
    DIMENSIONS.map((dim) => {
      const n = raw.dimensions?.[dim];
      const fallback = novelty.veto ? 25 : clarified.low_specificity ? 45 : 60;
      return [dim, typeof n === "number" ? Math.min(100, Math.max(0, n)) : fallback];
    }),
  ) as ScorecardResult["dimensions"];

  const weights = Object.fromEntries(
    DIMENSIONS.map((dim) => [dim, 1 / DIMENSIONS.length]),
  );

  const next_actions = Array.isArray(raw.next_actions)
    ? raw.next_actions.map(String).slice(0, 3)
    : [];
  while (next_actions.length < 3) {
    next_actions.push("Re-run Idea4AI after gathering more evidence.");
  }

  return {
    scorecard: scorecardResultSchema.parse({
      demand_signals,
      signal_notes,
      dimensions,
      weights,
      composite: composite(dimensions, weights),
    }),
    next_actions: next_actions.slice(0, 3),
  };
}
