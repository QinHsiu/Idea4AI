import { describe, expect, it } from "vitest";
import { validationReportSchema } from "../schemas";
import killFixture from "../fixtures/mock_kill.json";
import testFixture from "../fixtures/mock_test.json";
import buildFixture from "../fixtures/mock_build.json";
import { mockRunId, pickFixture } from "../mock/selectFixture";
import { runShort } from "../evidence";
import { runPipeline } from "../pipeline";

describe("MOCK_LLM fixtures", () => {
  it("parses all fixtures and preserves their required verdict bands", () => {
    const fixtures = [
      [killFixture, "kill"],
      [testFixture, "test"],
      [buildFixture, "build"],
    ] as const;

    for (const [fixture, expectedVerdict] of fixtures) {
      const parsed = validationReportSchema.parse(fixture);
      expect(parsed.pipeline_version).toBe("p0.1.0");
      expect(parsed.next_actions).toHaveLength(3);
      expect(parsed.verdict.verdict).toBe(expectedVerdict);
      expect(parsed.monetization).not.toBeNull();
      expect(parsed.pmf).not.toBeNull();
      expect(parsed.pmf?.status).toBeTruthy();
      expect(parsed.experiments).not.toBeNull();
      expect(parsed.experiments?.length).toBeGreaterThanOrEqual(3);
      expect(parsed.canvas).not.toBeNull();
      expect(parsed.pestle).not.toBeNull();
      expect(parsed.pitch).toBeTruthy();
      expect(parsed.research).not.toBeNull();
      expect(parsed.research?.mode).toBe("heuristic");
      expect(
        parsed.evidence.every((item) =>
          item.id.startsWith(`ev_${runShort(parsed.run_id)}_`),
        ),
      ).toBe(true);
    }
  });

  it("selects an explicit override without hashing it", () => {
    expect(pickFixture("anything", "build")).toBe("build");
  });

  it.each(["kill", "test", "build"] as const)("runs the %s override", async (fixture) => {
    const report = await runPipeline("x", { mockFixture: fixture, ideaId: "idea_test" });
    expect(report.idea_id).toBe("idea_test");
    expect(report.verdict.verdict).toBe(fixture);
    expect(validationReportSchema.parse(report)).toBeTruthy();
  });

  it("selects deterministically and derives hashed mock run ids", () => {
    expect(pickFixture("  My Idea  ")).toBe(pickFixture("my idea"));
    expect(mockRunId("test", "  My Idea  ")).toMatch(/^mock_test_[a-f0-9]{12}$/);
  });
});
