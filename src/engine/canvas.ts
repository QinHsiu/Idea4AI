import {
  canvasLiteSchema,
  type AudienceProfile,
  type CanvasLite,
  type ClarifiedIdea,
  type NoveltyResult,
  type ScorecardResult,
  type ValidationReport,
  type VerdictResult,
} from "./schemas";

type Monetization = NonNullable<ValidationReport["monetization"]>;

/** Lean Canvas + JTBD + SWOT lite (idea-validator mathews-tom absorb). */
export function canvasLite(input: {
  clarified: ClarifiedIdea;
  audience: AudienceProfile;
  novelty: NoveltyResult;
  scorecard: ScorecardResult;
  verdict: VerdictResult;
  monetization: Monetization;
}): CanvasLite {
  const { clarified, audience, novelty, scorecard, verdict, monetization } =
    input;

  const threats = [
    novelty.veto || novelty.template_hit
      ? "Crowded / template space — differentiation at risk"
      : "Incumbents can copy a thin wedge quickly",
  ];
  if (scorecard.dimensions.Distribution < 50) {
    threats.push("Weak distribution channel");
  }

  const weaknesses = [
    clarified.low_specificity
      ? "Idea still underspecified"
      : "Evidence mostly L0/L1 until experiments run",
  ];
  if (scorecard.dimensions.Willingness < 50) {
    weaknesses.push("Willingness-to-pay unproven");
  }

  return canvasLiteSchema.parse({
    lean: {
      problem: clarified.pain,
      customer_segments: audience.primary.persona,
      unique_value_proposition: clarified.one_liner,
      solution: clarified.artifact,
      channels: audience.primary.context,
      revenue_streams: `${monetization.model}: ${monetization.price_hypothesis}`,
      cost_structure: "Primarily build + distribution experiments (≤$100 probes)",
      key_metrics: `Composite ${scorecard.composite}; verdict ${verdict.verdict}`,
      unfair_advantage:
        scorecard.dimensions.FounderFit >= 60
          ? "Founder-market fit signal present — deepen it"
          : "No clear unfair advantage yet — earn one via speed/niche",
    },
    jtbd: {
      job: `When I am ${audience.primary.context}, I want to address ${clarified.pain}`,
      situation: audience.primary.context,
      outcome: `So I can move forward with ${clarified.artifact} confidently`,
    },
    swot: {
      strengths: [
        `Pain score ${scorecard.dimensions.Pain}`,
        `Buildability ${scorecard.dimensions.Buildability}`,
      ],
      weaknesses,
      opportunities: [
        clarified.why_now,
        `Reachable audience: ${audience.primary.reachability}`,
      ],
      threats,
    },
  });
}
