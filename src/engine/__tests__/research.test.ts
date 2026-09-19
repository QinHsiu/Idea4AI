import { describe, expect, it } from "vitest";
import { pitchLite, researchLite } from "../research";
import type {
  AudienceProfile,
  ClarifiedIdea,
  NoveltyResult,
  ScorecardResult,
  VerdictResult,
} from "../schemas";

const clarified: ClarifiedIdea = {
  who: "indie founders",
  pain: "wasting weeks building unvalidated ideas",
  artifact: "validation report",
  why_now: "vibe coding is fast",
  one_liner: "Validate vibe-coding ideas before building",
  assumptions: [],
  low_specificity: false,
};

const audience: AudienceProfile = {
  primary: {
    persona: "indie founders",
    context: "Discord",
    reachability: "high",
    notes: "n",
  },
  non_audience: [],
};

const novelty: NoveltyResult = {
  veto: false,
  template_hit: false,
  collision_hints: [
    {
      source: "npm",
      title: "related-pkg",
      url: "https://www.npmjs.com/package/related-pkg",
      grade: "L2",
    },
  ],
  require_rewrite: false,
  rewrite_suggestions: [],
};

const scorecard: ScorecardResult = {
  demand_signals: {
    demand: { score: 70, confidence: 50, evidence_ids: [] },
    pain: { score: 70, confidence: 50, evidence_ids: [] },
    competition: { score: 70, confidence: 50, evidence_ids: [] },
    funding: { score: 70, confidence: 50, evidence_ids: [] },
    urgency: { score: 70, confidence: 50, evidence_ids: [] },
    distribution: { score: 70, confidence: 50, evidence_ids: [] },
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
    Pain: 70,
    Urgency: 70,
    Differentiation: 70,
    Buildability: 70,
    Distribution: 70,
    Willingness: 70,
    Competition: 70,
    FounderFit: 70,
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
  composite: 70,
};

const verdict: VerdictResult = {
  verdict: "test",
  rationale: ["ok"],
  caps_applied: [],
};

describe("researchLite", () => {
  it("builds a heuristic brief with sources from collisions", async () => {
    const r = await researchLite({
      ideaText: "Validate vibe-coding ideas before building",
      clarified,
      audience,
      novelty,
      scorecard,
      verdict,
    });
    expect(r.mode).toBe("heuristic");
    expect(r.findings.length).toBeGreaterThan(0);
    expect(r.sources[0]?.url).toContain("npmjs.com");
    expect(r.confidence).toBeGreaterThan(0);
  });
});

describe("pitchLite", () => {
  it("embeds verdict and confidence", async () => {
    const r = await researchLite({
      ideaText: "x",
      clarified,
      audience,
      novelty,
      scorecard,
      verdict,
    });
    const pitch = pitchLite(clarified, verdict, r);
    expect(pitch).toContain("test");
    expect(pitch).toContain(`${r.confidence}`);
  });
});
