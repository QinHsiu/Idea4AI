import { describe, expect, it } from "vitest";
import { validationReportSchema } from "../schemas";
import killFixture from "../fixtures/mock_kill.json";
import testFixture from "../fixtures/mock_test.json";
import buildFixture from "../fixtures/mock_build.json";
import { mockRunId, pickFixture } from "../mock/selectFixture";
import { runShort } from "../evidence";

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
      expect(parsed.monetization).toBeNull();
      expect(parsed.pmf).toBeNull();
      expect(parsed.experiments).toBeNull();
      expect(parsed.canvas).toBeNull();
      expect(parsed.pestle).toBeNull();
      expect(parsed.pitch).toBeNull();
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

  it("selects deterministically and derives hashed mock run ids", () => {
    expect(pickFixture("  My Idea  ")).toBe(pickFixture("my idea"));
    expect(mockRunId("test", "  My Idea  ")).toMatch(/^mock_test_[a-f0-9]{12}$/);
  });
});
