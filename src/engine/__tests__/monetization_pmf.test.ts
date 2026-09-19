import { describe, expect, it } from "vitest";
import { monetizationLite } from "../monetization";
import { pmfLite } from "../pmf";
import type { ClarifiedIdea, NoveltyResult, ScorecardResult } from "../schemas";

const clarified = (overrides: Partial<ClarifiedIdea> = {}): ClarifiedIdea => ({
  who: "indie founders",
  pain: "wasting weeks on unvalidated ideas",
  artifact: "SaaS validation report",
  why_now: "vibe coding is fast",
  one_liner: "SaaS tool that validates vibe-coding ideas before build",
  assumptions: ["founders will pay for clarity"],
  low_specificity: false,
  ...overrides,
});

const scorecard = (n: number): ScorecardResult => ({
  demand_signals: {
    demand: { score: n, confidence: 50, evidence_ids: [] },
    pain: { score: n, confidence: 50, evidence_ids: [] },
    competition: { score: n, confidence: 50, evidence_ids: [] },
    funding: { score: n, confidence: 50, evidence_ids: [] },
    urgency: { score: n, confidence: 50, evidence_ids: [] },
    distribution: { score: n, confidence: 50, evidence_ids: [] },
  },
  signal_notes: {
    demand: "",
    pain: "",
    competition: "",
    funding: "",
    urgency: "",
    distribution: "",
  },
  dimensions: {
    Pain: n,
    Urgency: n,
    Differentiation: n,
    Buildability: n,
    Distribution: n,
    Willingness: n,
    Competition: n,
    FounderFit: n,
  },
  weights: Object.fromEntries(
    [
      "Pain",
      "Urgency",
      "Differentiation",
      "Buildability",
      "Distribution",
      "Willingness",
      "Competition",
      "FounderFit",
    ].map((k) => [k, 0.125]),
  ),
  composite: n,
});

const novelty = (veto = false): NoveltyResult => ({
  veto,
  template_hit: veto,
  collision_hints: [],
  require_rewrite: veto,
  reason: veto ? "template" : undefined,
  rewrite_suggestions: veto ? ["Narrow the audience and pain."] : [],
});

describe("monetizationLite", () => {
  it("picks subscription for SaaS wording", () => {
    const m = monetizationLite(clarified(), scorecard(70), "SaaS for founders");
    expect(m.model).toBe("subscription");
    expect(m.price_hypothesis).toContain("$");
    expect(m.willingness_link).toContain("70");
  });

  it("picks usage for API/token wording", () => {
    const m = monetizationLite(
      clarified({ artifact: "API" }),
      scorecard(50),
      "metered API credits for validation",
    );
    expect(m.model).toBe("usage");
  });
});

describe("pmfLite", () => {
  it("marks strong when composite and gates are high", () => {
    const p = pmfLite(clarified(), scorecard(80), novelty(false));
    expect(p.status).toBe("strong");
    expect(p.caps_verdict).toBe(false);
  });

  it("marks weak + caps when novelty veto", () => {
    const p = pmfLite(clarified(), scorecard(80), novelty(true));
    expect(p.status).toBe("weak");
    expect(p.caps_verdict).toBe(true);
  });

  it("marks mixed in the mid band", () => {
    const p = pmfLite(clarified(), scorecard(68), novelty(false));
    expect(p.status).toBe("mixed");
    expect(p.caps_verdict).toBe(false);
  });
});
