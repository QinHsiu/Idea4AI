import { describe, it, expect } from "vitest";
import {
  clarifiedIdeaSchema,
  noveltyResultSchema,
  scorecardResultSchema,
  validationReportSchema,
} from "../schemas";

const baseClarified = {
  who: "solo founders",
  pain: "validating ideas",
  artifact: "report",
  why_now: "AI boom",
  one_liner: "AI idea validator",
  assumptions: ["users pay"],
  low_specificity: false,
};

const baseAudience = {
  primary: {
    persona: "indie hacker",
    context: "side projects",
    reachability: "high" as const,
    notes: "",
  },
  non_audience: ["enterprises"],
};

const baseScorecard = {
  demand_signals: {
    demand: { score: 50, confidence: 50, evidence_ids: [] },
    pain: { score: 50, confidence: 50, evidence_ids: [] },
    competition: { score: 50, confidence: 50, evidence_ids: [] },
    funding: { score: 50, confidence: 50, evidence_ids: [] },
    urgency: { score: 50, confidence: 50, evidence_ids: [] },
    distribution: { score: 50, confidence: 50, evidence_ids: [] },
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
    Pain: 50,
    Urgency: 50,
    Differentiation: 50,
    Buildability: 50,
    Distribution: 50,
    Willingness: 50,
    Competition: 50,
    FounderFit: 50,
  },
  weights: {
    Pain: 0.125,
    Urgency: 0.125,
    Differentiation: 0.125,
    Buildability: 0.125,
    Distribution: 0.125,
    Willingness: 0.125,
    Competition: 0.125,
    FounderFit: 0.125,
  },
  composite: 50,
};

describe("clarifiedIdeaSchema", () => {
  it("requires low_specificity", () => {
    const { low_specificity: _, ...without } = baseClarified;
    expect(clarifiedIdeaSchema.safeParse(without).success).toBe(false);
    expect(clarifiedIdeaSchema.safeParse(baseClarified).success).toBe(true);
  });
});

describe("noveltyResultSchema", () => {
  it("rejects L2 collision without url", () => {
    const result = noveltyResultSchema.safeParse({
      veto: false,
      template_hit: false,
      collision_hints: [
        { source: "web", title: "Similar tool", grade: "L2" },
      ],
      require_rewrite: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts L2 collision with http url", () => {
    const result = noveltyResultSchema.safeParse({
      veto: false,
      template_hit: false,
      collision_hints: [
        {
          source: "web",
          title: "Similar tool",
          grade: "L2",
          url: "https://example.com",
        },
      ],
      require_rewrite: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("scorecardResultSchema", () => {
  it("allows dangling evidence_ids without evidence array", () => {
    const result = scorecardResultSchema.safeParse({
      ...baseScorecard,
      demand_signals: {
        ...baseScorecard.demand_signals,
        demand: { score: 50, confidence: 50, evidence_ids: ["ev_mockkill_999"] },
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("validationReportSchema", () => {
  const baseReport = {
    idea_id: "idea-1",
    run_id: "mock_kill_a1b2c3d4e5f6",
    clarified: baseClarified,
    audience: baseAudience,
    novelty: {
      veto: false,
      template_hit: false,
      collision_hints: [],
      require_rewrite: false,
    },
    scorecard: baseScorecard,
    verdict: {
      verdict: "test" as const,
      rationale: ["ok"],
      caps_applied: [] as const,
    },
    evidence: [{ id: "ev_mockkill_001", claim: "c", grade: "L0" as const }],
    next_actions: ["a", "b", "c"],
    pipeline_version: "p0.1.0",
    monetization: null,
    pmf: null,
    experiments: null,
    canvas: null,
    pestle: null,
    pitch: null,
  };

  it("rejects dangling evidence_ids in demand_signals", () => {
    const result = validationReportSchema.safeParse({
      ...baseReport,
      scorecard: {
        ...baseScorecard,
        demand_signals: {
          ...baseScorecard.demand_signals,
          demand: {
            score: 50,
            confidence: 50,
            evidence_ids: ["ev_mockkill_999"],
          },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts evidence_ids that exist in evidence", () => {
    const result = validationReportSchema.safeParse({
      ...baseReport,
      scorecard: {
        ...baseScorecard,
        demand_signals: {
          ...baseScorecard.demand_signals,
          demand: {
            score: 50,
            confidence: 50,
            evidence_ids: ["ev_mockkill_001"],
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects L2 evidence without url", () => {
    const result = validationReportSchema.safeParse({
      ...baseReport,
      evidence: [{ id: "ev_mockkill_001", claim: "c", grade: "L2" }],
    });
    expect(result.success).toBe(false);
  });
});
