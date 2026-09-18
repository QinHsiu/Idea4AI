import { describe, it, expect } from "vitest";
import { foldSignalsToDimensions, composite } from "../fold";
import weights from "../weights.json";

describe("foldSignalsToDimensions", () => {
  it("folds demand+pain into Pain", () => {
    const dims = foldSignalsToDimensions({
      demand: 80,
      pain: 100,
      competition: 20,
      funding: null,
      urgency: 50,
      distribution: 40,
    });
    // Pain = 0.6*80 + 0.4*100 = 88
    expect(dims.Pain).toBeCloseTo(88, 5);
    // Willingness contributors: demand(0.4), funding(0.5) — funding null ⇒ Willingness = demand = 80
    expect(dims.Willingness).toBeCloseTo(80, 5);
    expect(dims.Competition).toBeCloseTo(20, 5);
    expect(dims.Urgency).toBeCloseTo(50, 5);
    expect(dims.Distribution).toBeCloseTo(40, 5);
  });

  it("uses only non-null contributors for Willingness when funding present", () => {
    const dims = foldSignalsToDimensions({
      demand: 80,
      pain: null,
      competition: null,
      funding: 60,
      urgency: null,
      distribution: null,
    });
    // (0.4*80 + 0.5*60) / (0.4 + 0.5) = 68.888...
    expect(dims.Willingness).toBeCloseTo(68.888888, 3);
    expect(dims.Competition).toBeCloseTo(60, 5);
  });

  it("returns pain alone as Pain", () => {
    const dims = foldSignalsToDimensions({
      demand: null,
      pain: 100,
      competition: null,
      funding: null,
      urgency: null,
      distribution: null,
    });
    expect(dims.Pain).toBeCloseTo(100, 5);
  });
});

describe("composite", () => {
  it("computes weighted sum of dimensions", () => {
    const dims = {
      Pain: 80,
      Urgency: 50,
      Differentiation: 70,
      Buildability: 60,
      Distribution: 55,
      Willingness: 65,
      Competition: 40,
      FounderFit: 75,
    };
    const expected =
      80 * 0.15 +
      50 * 0.1 +
      70 * 0.15 +
      60 * 0.15 +
      55 * 0.15 +
      65 * 0.1 +
      40 * 0.1 +
      75 * 0.1;
    expect(composite(dims, weights)).toBeCloseTo(expected, 5);
  });
});

describe("weights.json", () => {
  it("weights sum to 1", () => {
    const s = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(s).toBeCloseTo(1, 6);
  });
});
