import { describe, expect, it } from "vitest";
import { experimentsLite } from "../experiments";
import { canvasLite } from "../canvas";
import { pestleLite } from "../pestle";
import type {
  AudienceProfile,
  ClarifiedIdea,
  NoveltyResult,
  ScorecardResult,
  ValidationReport,
  VerdictResult,
} from "../schemas";

const clarified: ClarifiedIdea = {
  who: "indie founders",
  pain: "wasting weeks on unvalidated ideas",
  artifact: "validation report",
  why_now: "vibe coding is fast",
  one_liner: "Validate vibe-coding ideas before building",
  assumptions: [],
  low_specificity: false,
};

const audience: AudienceProfile = {
  primary: {
    persona: "indie founders",
    context: "founder Discord",
    reachability: "high",
    notes: "n",
  },
  non_audience: [],
};

const noveltyOk: NoveltyResult = {
  veto: false,
  template_hit: false,
  collision_hints: [],
  require_rewrite: false,
  rewrite_suggestions: [],
};

const noveltyVeto: NoveltyResult = {
  ...noveltyOk,
  veto: true,
  template_hit: true,
  require_rewrite: true,
  rewrite_suggestions: ["Narrow the wedge."],
};

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

const monetization: NonNullable<ValidationReport["monetization"]> = {
  model: "subscription",
  price_hypothesis: "$19/mo",
  revenue_notes: "n",
  willingness_link: "Willingness 70",
};

const pmfStrong: NonNullable<ValidationReport["pmf"]> = {
  status: "strong",
  signals: ["ok"],
  gaps: [],
  caps_verdict: false,
};

const pmfWeak: NonNullable<ValidationReport["pmf"]> = {
  status: "weak",
  signals: [],
  gaps: ["weak"],
  caps_verdict: true,
};

describe("experimentsLite", () => {
  it("returns Test Card fields and kill-oriented set on veto", () => {
    const cards = experimentsLite({
      clarified,
      audience,
      novelty: noveltyVeto,
      verdict: { verdict: "kill", rationale: [], caps_applied: ["novelty_veto"] },
      pmf: pmfWeak,
    });
    expect(cards).toHaveLength(3);
    expect(cards.map((c) => c.type)).toEqual(["mom_test", "rat", "fake_door"]);
    expect(cards[0].hypothesis).toBeTruthy();
    expect(cards[0].method).toBeTruthy();
    expect(cards.every((c) => c.budget_usd <= 100 && c.duration_days <= 14)).toBe(
      true,
    );
  });

  it("prefers concierge first on strong build", () => {
    const cards = experimentsLite({
      clarified,
      audience,
      novelty: noveltyOk,
      verdict: { verdict: "build", rationale: [], caps_applied: [] },
      pmf: pmfStrong,
    });
    expect(cards[0].type).toBe("concierge");
  });
});

describe("canvasLite", () => {
  it("fills lean / jtbd / swot", () => {
    const c = canvasLite({
      clarified,
      audience,
      novelty: noveltyOk,
      scorecard: scorecard(70),
      verdict: { verdict: "test", rationale: [], caps_applied: [] },
      monetization,
    });
    expect(c.lean.problem).toContain("unvalidated");
    expect(c.jtbd.job).toContain("founder Discord");
    expect(c.swot.strengths.length).toBeGreaterThan(0);
  });
});

describe("pestleLite", () => {
  it("returns all six dimensions", () => {
    const p = pestleLite({
      clarified,
      novelty: noveltyOk,
      scorecard: scorecard(70),
      verdict: { verdict: "test", rationale: [], caps_applied: [] } satisfies VerdictResult,
    });
    expect(p.political).toBeTruthy();
    expect(p.technological).toMatch(/Buildability/);
  });
});
