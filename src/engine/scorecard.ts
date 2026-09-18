import { EvidenceAccumulator } from "./evidence";
import { composite, DIMENSIONS } from "./fold";
import { scorecardResultSchema, type AudienceProfile, type ClarifiedIdea, type NoveltyResult, type ScorecardResult } from "./schemas";

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
  const base = novelty.veto ? 25 : clarified.low_specificity ? 45 : 65;
  const dimensions = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, base]));
  const weights = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, 1 / DIMENSIONS.length]));
  const demandSignals = Object.fromEntries(
    ["demand", "pain", "competition", "funding", "urgency", "distribution"].map((key) => [
      key,
      { score: base, confidence: 40, evidence_ids: [evidenceId] },
    ]),
  );
  const signalNotes = Object.fromEntries(
    ["demand", "pain", "competition", "funding", "urgency", "distribution"].map((key) => [
      key,
      `Heuristic ${key} assessment; validate with users.`,
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
