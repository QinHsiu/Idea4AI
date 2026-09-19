import {
  experimentCardSchema,
  type AudienceProfile,
  type ClarifiedIdea,
  type ExperimentCard,
  type NoveltyResult,
  type ValidationReport,
  type VerdictResult,
} from "./schemas";

type Pmf = NonNullable<ValidationReport["pmf"]>;

/**
 * Venture Analyst / idea-validation-agents / testing-business-ideas absorb:
 * 3 prioritized experiments with Test Card fields (hypothesis + method).
 */
export function experimentsLite(input: {
  clarified: ClarifiedIdea;
  audience: AudienceProfile;
  novelty: NoveltyResult;
  verdict: VerdictResult;
  pmf: Pmf;
}): ExperimentCard[] {
  const { clarified, audience, novelty, verdict, pmf } = input;
  const who = audience.primary.persona || clarified.who;
  const pain = clarified.pain;

  const mom = experimentCardSchema.parse({
    name: "Mom Test interviews",
    type: "mom_test",
    duration_days: 7,
    budget_usd: 0,
    success_metric: `≥5 ${who} describe ${pain} in their own words without prompting the solution`,
    hypothesis: `${who} currently feel ${pain} at least weekly`,
    method: `Interview 5–8 ${who}; ask about last time the pain happened, workarounds, and willingness to pay — never pitch the idea first`,
  });

  const rat = experimentCardSchema.parse({
    name: "Riskiest Assumption Test",
    type: "rat",
    duration_days: 14,
    budget_usd: Math.min(
      100,
      pmf.status === "weak" || novelty.veto ? 20 : 50,
    ),
    success_metric:
      "Riskiest assumption falsified or supported with ≥1 concrete evidence artifact",
    hypothesis:
      novelty.veto || pmf.caps_verdict
        ? "A narrower wedge still has reachable demand"
        : `Users will pay for ${clarified.artifact} within 14 days of a credible promise`,
    method:
      "Write the single riskiest assumption, design the cheapest test ≤$100 / ≤2 weeks, run it, record evidence grade",
  });

  const fakeDoor = experimentCardSchema.parse({
    name: "Fake-door / smoke landing",
    type: "fake_door",
    duration_days: 7,
    budget_usd: 40,
    success_metric: "≥5% CTR to waitlist or ≥10 qualified signups",
    hypothesis: `${who} will click/sign up for a solution to ${pain}`,
    method:
      "One landing page + CTA; drive a small paid or community traffic burst; no full product",
  });

  const concierge = experimentCardSchema.parse({
    name: "Concierge MVP",
    type: "concierge",
    duration_days: 14,
    budget_usd: 80,
    success_metric: "Deliver value manually to ≥3 users; ≥2 would pay again",
    hypothesis: `${clarified.artifact} creates enough value that ${who} retain after a manual run`,
    method: `Manually run the workflow for 3 ${who}; log time-to-value and objections`,
  });

  if (verdict.verdict === "kill" || novelty.veto) {
    return [mom, rat, fakeDoor];
  }
  if (verdict.verdict === "build" && pmf.status === "strong") {
    return [concierge, fakeDoor, rat];
  }
  return [mom, fakeDoor, rat];
}
