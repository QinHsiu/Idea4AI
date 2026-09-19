import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryStore } from "../memory";
import { validationReportSchema } from "@/engine/schemas";
import killFixture from "@/engine/fixtures/mock_kill.json";
import testFixture from "@/engine/fixtures/mock_test.json";
import buildFixture from "@/engine/fixtures/mock_build.json";

describe("P0 golden fixtures — verdict class", () => {
  it("kill fixture is kill class (veto or composite < 40)", () => {
    const r = validationReportSchema.parse(killFixture);
    expect(r.verdict.verdict).toBe("kill");
    expect(r.novelty.veto || r.scorecard.composite < 40).toBe(true);
  });

  it("test fixture is test class (60–74 band)", () => {
    const r = validationReportSchema.parse(testFixture);
    expect(r.verdict.verdict).toBe("test");
    expect(r.scorecard.composite).toBeGreaterThanOrEqual(60);
    expect(r.scorecard.composite).toBeLessThanOrEqual(74);
  });

  it("build fixture is build class (≥75 with Pain/Buildability gates)", () => {
    const r = validationReportSchema.parse(buildFixture);
    expect(r.verdict.verdict).toBe("build");
    expect(r.scorecard.composite).toBeGreaterThanOrEqual(75);
    expect(r.scorecard.dimensions.Pain).toBeGreaterThanOrEqual(50);
    expect(r.scorecard.dimensions.Buildability).toBeGreaterThanOrEqual(50);
    expect(r.scorecard.dimensions.Differentiation).toBeGreaterThanOrEqual(30);
    expect(r.scorecard.dimensions.Distribution).toBeGreaterThanOrEqual(30);
  });
});

describe("P0 web path: create → validate → report", () => {
  let store: ReturnType<typeof createMemoryStore>;

  beforeEach(() => {
    store = createMemoryStore();
  });

  it.each(["kill", "test", "build"] as const)(
    "fixture=%s yields readable report with matching verdict",
    async (fixture) => {
      const { id } = await store.createIdea(`golden idea for ${fixture}`);
      const { run_id } = await store.startValidate(id, fixture);
      const run = await store.waitForRun(run_id);
      expect(run?.status).toBe("completed");
      const report = await store.getReport(id);
      expect(report).toBeDefined();
      const parsed = validationReportSchema.parse(report);
      expect(parsed.verdict.verdict).toBe(fixture);
      expect(parsed.next_actions).toHaveLength(3);
      expect((await store.getIdea(id))?.text).toContain(fixture);
    },
  );
});
