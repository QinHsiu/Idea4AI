import { afterEach, describe, expect, it } from "vitest";
import { deterministicRunId } from "../runId";
import { scorecard } from "../scorecard";
import { EvidenceAccumulator } from "../evidence";
import { runPipeline } from "../pipeline";
import type { AudienceProfile, ClarifiedIdea, NoveltyResult } from "../schemas";

describe("deterministicRunId", () => {
  it("is stable for the same ideaId + text", () => {
    const a = deterministicRunId("idea_1", "  Cursor plugin for PR review  ");
    const b = deterministicRunId("idea_1", "cursor plugin for pr review");
    expect(a).toBe(b);
    expect(a).toMatch(/^run_[a-f0-9]{12}$/);
  });

  it("changes when idea text changes", () => {
    expect(deterministicRunId("idea_1", "aaa")).not.toBe(
      deterministicRunId("idea_1", "bbb"),
    );
  });
});

describe("heuristic scorecard differentiation", () => {
  const clarified: ClarifiedIdea = {
    who: "junior engineers",
    pain: "missing timely PR feedback on large diffs every sprint",
    artifact: "Cursor plugin",
    why_now: "review backlog is urgent this week",
    one_liner: "Cursor plugin that reviews PR diffs for junior engineers",
    assumptions: [],
    low_specificity: false,
  };
  const audience: AudienceProfile = {
    primary: {
      persona: "junior engineers",
      context: "GitHub PRs",
      reachability: "high",
      notes: "n",
    },
    non_audience: [],
  };
  const novelty: NoveltyResult = {
    veto: false,
    template_hit: false,
    collision_hints: [],
    require_rewrite: false,
    rewrite_suggestions: [],
  };

  it("does not assign the same score to every dimension", () => {
    const acc = new EvidenceAccumulator("run_abcd1234ef00");
    const result = scorecard(clarified, audience, novelty, acc);
    const values = Object.values(result.dimensions);
    expect(new Set(values).size).toBeGreaterThan(1);
    expect(result.dimensions.Buildability).toBeGreaterThan(
      result.dimensions.Competition,
    );
  });
});

describe("pipeline run_id binding", () => {
  const prev = {
    MOCK_LLM: process.env.MOCK_LLM,
    ENABLE_RETRIEVAL: process.env.ENABLE_RETRIEVAL,
    ENABLE_DEEP_RESEARCH: process.env.ENABLE_DEEP_RESEARCH,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  };

  afterEach(() => {
    process.env.MOCK_LLM = prev.MOCK_LLM;
    process.env.ENABLE_RETRIEVAL = prev.ENABLE_RETRIEVAL;
    process.env.ENABLE_DEEP_RESEARCH = prev.ENABLE_DEEP_RESEARCH;
    process.env.OPENAI_API_KEY = prev.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = prev.ANTHROPIC_API_KEY;
  });

  function forceHeuristic() {
    process.env.MOCK_LLM = "0";
    process.env.ENABLE_RETRIEVAL = "0";
    process.env.ENABLE_DEEP_RESEARCH = "0";
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  }

  it("uses opts.runId for report.run_id and evidence prefix when not mock", async () => {
    forceHeuristic();
    const runId = "run_storebound01";
    const report = await runPipeline(
      "Cursor plugin that reviews PR diffs for junior engineers on a team",
      { ideaId: "idea_bound", runId },
    );
    expect(report.run_id).toBe(runId);
    expect(report.evidence[0]?.id.startsWith("ev_runstore")).toBe(true);
  });

  it("falls back to deterministicRunId when runId omitted", async () => {
    forceHeuristic();
    const text = "Focused CLI that validates vibe-coding ideas for indie founders";
    const expected = deterministicRunId("idea_det", text);
    const a = await runPipeline(text, { ideaId: "idea_det" });
    const b = await runPipeline(text, { ideaId: "idea_det" });
    expect(a.run_id).toBe(expected);
    expect(b.run_id).toBe(expected);
    expect(a.evidence.map((e) => e.id)).toEqual(b.evidence.map((e) => e.id));
  });
});
