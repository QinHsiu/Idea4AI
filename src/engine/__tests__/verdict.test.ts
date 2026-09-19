import { describe, it, expect } from "vitest";
import { computeVerdict } from "../verdict";
import type { ScorecardResult } from "../schemas";

type Dimensions = ScorecardResult["dimensions"];

const baseDims = (overrides: Partial<Dimensions> = {}): Dimensions => ({
  Pain: 60,
  Urgency: 50,
  Differentiation: 50,
  Buildability: 60,
  Distribution: 50,
  Willingness: 50,
  Competition: 50,
  FounderFit: 50,
  ...overrides,
});

describe("computeVerdict", () => {
  it.each([
    {
      name: "novelty veto → kill + novelty_veto",
      input: {
        dimensions: baseDims(),
        composite: 80,
        noveltyVeto: true,
      },
      expected: { verdict: "kill" as const, caps: ["novelty_veto"] },
    },
    {
      name: "composite 80, Diff 20 → pivot + diff_or_dist_lt_30",
      input: {
        dimensions: baseDims({ Differentiation: 20 }),
        composite: 80,
        noveltyVeto: false,
      },
      expected: { verdict: "pivot" as const, caps: ["diff_or_dist_lt_30"] },
    },
    {
      name: "composite 80, Pain 40, Build 80, Diff/Dist ok → test + build_gate_fail",
      input: {
        dimensions: baseDims({ Pain: 40, Buildability: 80 }),
        composite: 80,
        noveltyVeto: false,
      },
      expected: { verdict: "test" as const, caps: ["build_gate_fail"] },
    },
    {
      name: "composite 80, Pain 60, Build 60 → build",
      input: {
        dimensions: baseDims({ Pain: 60, Buildability: 60 }),
        composite: 80,
        noveltyVeto: false,
      },
      expected: { verdict: "build" as const, caps: [] },
    },
    {
      name: "composite 50 → pivot",
      input: {
        dimensions: baseDims(),
        composite: 50,
        noveltyVeto: false,
      },
      expected: { verdict: "pivot" as const, caps: [] },
    },
    {
      name: "composite 30 → kill",
      input: {
        dimensions: baseDims(),
        composite: 30,
        noveltyVeto: false,
      },
      expected: { verdict: "kill" as const, caps: [] },
    },
    {
      name: "composite 80 + pmfWeak → test + pmf_weak_cap",
      input: {
        dimensions: baseDims({ Pain: 60, Buildability: 60 }),
        composite: 80,
        noveltyVeto: false,
        pmfWeak: true,
      },
      expected: { verdict: "test" as const, caps: ["pmf_weak_cap"] },
    },
  ])("$name", ({ input, expected }) => {
    const result = computeVerdict(input);
    expect(result.verdict).toBe(expected.verdict);
    expect(result.caps_applied).toEqual(expected.caps);
    expect(result.rationale.length).toBeGreaterThan(0);
  });
});
