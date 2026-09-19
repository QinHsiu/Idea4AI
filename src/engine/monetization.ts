import {
  clarifiedIdeaSchema,
  type ClarifiedIdea,
  type ScorecardResult,
  type ValidationReport,
} from "./schemas";
import { z } from "zod";

export type MonetizationLite = NonNullable<ValidationReport["monetization"]>;

const monetizationLiteSchema = z.object({
  model: z.enum([
    "subscription",
    "usage",
    "one_time",
    "freemium",
    "marketplace",
    "other",
  ]),
  price_hypothesis: z.string(),
  revenue_notes: z.string(),
  willingness_link: z.string(),
});

function pickModel(clarified: ClarifiedIdea, ideaText: string): MonetizationLite["model"] {
  const blob = `${ideaText} ${clarified.artifact} ${clarified.one_liner}`.toLowerCase();
  if (/\b(marketplace|two[- ]sided|platform)\b/.test(blob)) return "marketplace";
  if (/\b(api|token|usage|metered|credits?)\b/.test(blob)) return "usage";
  if (/\b(plugin|extension|theme|one[- ]time|license)\b/.test(blob)) return "one_time";
  if (/\b(freemium|free tier|open core)\b/.test(blob)) return "freemium";
  if (/\b(saas|subscription|seat|monthly|b2b)\b/.test(blob)) return "subscription";
  if (clarified.low_specificity) return "other";
  return "subscription";
}

function priceHypothesis(model: MonetizationLite["model"], willingness: number): string {
  if (model === "usage") {
    return willingness >= 60
      ? "$0.01–$0.05 per validated idea / API call"
      : "Usage pricing TBD after willingness interviews";
  }
  if (model === "one_time") {
    return willingness >= 60 ? "$29–$79 one-time seat" : "$9–$29 one-time (test price)";
  }
  if (model === "marketplace") {
    return "10–20% take rate on paid transactions";
  }
  if (model === "freemium") {
    return "Free core; $12–$29/mo Pro for deeper reports";
  }
  if (model === "other") {
    return "Pricing model unclear — validate willingness before locking";
  }
  return willingness >= 70
    ? "$19–$49/mo per founder seat"
    : "$9–$19/mo early-bird seat";
}

/** Heuristic monetization lite (AI Idea Validator / Founder Intelligence absorb). */
export function monetizationLite(
  clarified: ClarifiedIdea,
  scorecard: ScorecardResult,
  ideaText = "",
): MonetizationLite {
  clarifiedIdeaSchema.parse(clarified);
  const willingness = scorecard.dimensions.Willingness;
  const model = pickModel(clarified, ideaText);
  const result = {
    model,
    price_hypothesis: priceHypothesis(model, willingness),
    revenue_notes: clarified.low_specificity
      ? "Idea is underspecified; treat any price as a probe, not a plan."
      : `Primary buyer: ${clarified.who}. Monetize the ${clarified.artifact} around pain: ${clarified.pain}.`,
    willingness_link: `Willingness score ${willingness}/100 → ${
      willingness >= 60 ? "credible paid probe" : "interview before charging"
    }.`,
  };
  return monetizationLiteSchema.parse(result);
}
