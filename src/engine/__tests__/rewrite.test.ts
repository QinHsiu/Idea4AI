import { describe, expect, it } from "vitest";
import { rewriteSuggestions } from "../rewrite";
import { novelty } from "../novelty";
import { EvidenceAccumulator } from "../evidence";
import type { AudienceProfile, ClarifiedIdea } from "../schemas";

const clarified: ClarifiedIdea = {
  who: "a broad general audience",
  pain: "an insufficiently specific problem to validate",
  artifact: "a focused product or workflow",
  why_now: "faster prototyping makes validation timely",
  one_liner: "AI-powered app for everything",
  assumptions: ["a specific user has this problem"],
  low_specificity: true,
};

const audience: AudienceProfile = {
  primary: {
    persona: "indie founders",
    context: "founder Discord",
    reachability: "high",
    notes: "reachable",
  },
  non_audience: ["enterprises"],
};

describe("rewriteSuggestions", () => {
  it("returns exactly 3 probes", () => {
    const list = rewriteSuggestions("AI-powered app for everything", clarified, audience);
    expect(list).toHaveLength(3);
    expect(list[0]).toContain("indie founders");
  });
});

describe("novelty + rewrite", () => {
  it("attaches suggestions when template hit", () => {
    const acc = new EvidenceAccumulator("mock_kill_a1b2c3d4e5f6");
    const result = novelty(
      { idea_text: "AI-powered app for everything" },
      clarified,
      audience,
      acc,
    );
    expect(result.require_rewrite).toBe(true);
    expect(result.rewrite_suggestions).toHaveLength(3);
  });

  it("leaves suggestions empty when specific", () => {
    const acc = new EvidenceAccumulator("mock_test_a1b2c3d4e5f6");
    const result = novelty(
      {
        idea_text:
          "Cursor plugin that reviews PR diffs for junior engineers on a team",
      },
      {
        ...clarified,
        who: "junior engineers",
        pain: "missing review feedback",
        low_specificity: false,
        one_liner: "Cursor plugin that reviews PR diffs for junior engineers",
      },
      audience,
      acc,
    );
    expect(result.require_rewrite).toBe(false);
    expect(result.rewrite_suggestions).toEqual([]);
  });
});
