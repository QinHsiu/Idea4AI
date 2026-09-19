import { z } from "zod";
import type {
  ClarifiedIdea,
  NoveltyResult,
  ScorecardResult,
  ValidationReport,
} from "./schemas";

export type PmfLite = NonNullable<ValidationReport["pmf"]>;

const pmfLiteSchema = z.object({
  status: z.enum(["strong", "mixed", "weak", "unknown"]),
  signals: z.array(z.string()),
  gaps: z.array(z.string()),
  caps_verdict: z.boolean(),
});

/** Heuristic PMF lite; caps_verdict=true feeds pmf_weak_cap in verdict. */
export function pmfLite(
  clarified: ClarifiedIdea,
  scorecard: ScorecardResult,
  novelty: NoveltyResult,
): PmfLite {
  const { composite, dimensions } = scorecard;
  const signals: string[] = [];
  const gaps: string[] = [];

  if (dimensions.Pain >= 60) signals.push(`Pain ${dimensions.Pain} suggests a felt problem`);
  else gaps.push(`Pain ${dimensions.Pain} is below a credible PMF floor`);

  if (dimensions.Willingness >= 60) {
    signals.push(`Willingness ${dimensions.Willingness} supports a paid probe`);
  } else {
    gaps.push(`Willingness ${dimensions.Willingness} — no clear pay signal yet`);
  }

  if (dimensions.Distribution >= 50) {
    signals.push(`Distribution ${dimensions.Distribution} shows a reachable channel`);
  } else {
    gaps.push(`Distribution ${dimensions.Distribution} — acquisition path unclear`);
  }

  if (novelty.veto || novelty.template_hit) {
    gaps.push(
      novelty.veto
        ? "Novelty veto — crowded / generic pattern"
        : "Template hit — rewrite before claiming differentiation",
    );
  } else {
    signals.push("No novelty veto on this run");
  }

  if (clarified.low_specificity) {
    gaps.push("Low specificity — PMF status is provisional");
  }

  let status: PmfLite["status"];
  if (novelty.veto || composite < 40) status = "weak";
  else if (clarified.low_specificity || composite < 55) status = "unknown";
  else if (composite >= 75 && dimensions.Pain >= 50 && dimensions.Willingness >= 50) {
    status = "strong";
  } else status = "mixed";

  const caps_verdict = status === "weak" || status === "unknown";

  return pmfLiteSchema.parse({ status, signals, gaps, caps_verdict });
}
