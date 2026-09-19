import { EvidenceAccumulator } from "./evidence";
import { composite, DIMENSIONS, type Dim } from "./fold";
import {
  scorecardResultSchema,
  type AudienceProfile,
  type ClarifiedIdea,
  type NoveltyResult,
  type ScorecardResult,
} from "./schemas";

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Heuristic scorecard (MOCK_LLM=0 without LLM keys).
 * Dimensions are differentiated from clarify/audience/novelty signals;
 * real LLM path uses scorecardWithLlm instead.
 */
export function scorecard(
  clarified: ClarifiedIdea,
  audience: AudienceProfile,
  novelty: NoveltyResult,
  acc: EvidenceAccumulator,
): ScorecardResult {
  const evidenceId = acc.add({
    claim: `Heuristic assessment for ${audience.primary.persona}: ${clarified.pain}`,
    grade: "L0",
  });

  const base = novelty.veto ? 25 : clarified.low_specificity ? 45 : 62;
  const reach =
    audience.primary.reachability === "high"
      ? 12
      : audience.primary.reachability === "mid"
        ? 4
        : -8;
  const collisionPenalty = Math.min(20, novelty.collision_hints.length * 5);
  const rewritePenalty = novelty.require_rewrite ? 10 : 0;
  const specificityBoost = clarified.low_specificity ? -8 : 6;

  const dimensions: Record<Dim, number> = {
    Pain: clamp(base + specificityBoost + (clarified.pain.length > 40 ? 4 : 0)),
    Urgency: clamp(base + (/\b(now|urgent|week|deadline)\b/i.test(clarified.why_now) ? 10 : -4)),
    Differentiation: clamp(base - collisionPenalty - rewritePenalty + (novelty.veto ? -15 : 8)),
    Buildability: clamp(base + 8 + (/\b(plugin|cli|api|extension|workflow)\b/i.test(clarified.artifact) ? 6 : 0)),
    Distribution: clamp(base + reach),
    Willingness: clamp(base + reach / 2 + (clarified.low_specificity ? -12 : 4)),
    Competition: clamp(base - collisionPenalty + (novelty.template_hit ? -10 : 5)),
    FounderFit: clamp(base + (audience.primary.reachability === "high" ? 8 : 0) + specificityBoost / 2),
  };

  const weights = Object.fromEntries(
    DIMENSIONS.map((dimension) => [dimension, 1 / DIMENSIONS.length]),
  );

  const demandBase = {
    demand: dimensions.Willingness,
    pain: dimensions.Pain,
    competition: dimensions.Competition,
    funding: clamp((dimensions.Willingness + dimensions.Competition) / 2),
    urgency: dimensions.Urgency,
    distribution: dimensions.Distribution,
  };

  const demandSignals = Object.fromEntries(
    (Object.keys(demandBase) as (keyof typeof demandBase)[]).map((key) => [
      key,
      {
        score: demandBase[key],
        confidence: novelty.veto ? 30 : clarified.low_specificity ? 35 : 45,
        evidence_ids: [evidenceId],
      },
    ]),
  );

  const signalNotes = Object.fromEntries(
    (Object.keys(demandBase) as (keyof typeof demandBase)[]).map((key) => [
      key,
      `Heuristic ${key} from clarify/audience/novelty; prefer LLM or live retrieval for production.`,
    ]),
  );

  return scorecardResultSchema.parse({
    demand_signals: demandSignals,
    signal_notes: signalNotes,
    dimensions,
    weights,
    composite: composite(dimensions, weights),
  });
}
