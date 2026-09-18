import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryStore } from "../memory";

describe("memory store", () => {
  let store: ReturnType<typeof createMemoryStore>;

  beforeEach(() => {
    store = createMemoryStore();
  });

  it("creates ideas and starts a run that becomes reportable", async () => {
    const idea = store.createIdea("An idea");
    expect(idea.id).toMatch(/^idea_/);

    const run = store.startValidate(idea.id, "build");
    expect(run.run_id).toMatch(/^run_/);
    expect(store.getRun(run.run_id)?.status).toBe("running");

    await store.waitForRun(run.run_id);
    expect(store.getRun(run.run_id)?.status).toBe("completed");
    expect(store.getReport(idea.id)?.idea_id).toBe(idea.id);
  });

  it("returns undefined for unknown records", () => {
    expect(store.getRun("missing")).toBeUndefined();
    expect(store.getReport("missing")).toBeUndefined();
    expect(store.getIdea("missing")).toBeUndefined();
  });

  it("lists ideas newest first", () => {
    const a = store.createIdea("first");
    const b = store.createIdea("second");
    const list = store.listIdeas();
    expect(list.map((x) => x.id)).toEqual([b.id, a.id]);
  });
});
