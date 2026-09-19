import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryStore } from "../memory";

describe("memory store", () => {
  let store: ReturnType<typeof createMemoryStore>;

  beforeEach(() => {
    store = createMemoryStore();
  });

  it("creates ideas and starts a run that becomes reportable", async () => {
    const idea = await store.createIdea("An idea");
    expect(idea.id).toMatch(/^idea_/);

    const run = await store.startValidate(idea.id, "build");
    expect(run.run_id).toMatch(/^run_/);

    const finished = await store.waitForRun(run.run_id);
    expect(finished?.status).toBe("completed");
    expect((await store.getRun(run.run_id))?.status).toBe("completed");
    expect((await store.getReport(idea.id))?.idea_id).toBe(idea.id);
  });

  it("returns undefined for unknown records", async () => {
    expect(await store.getRun("missing")).toBeUndefined();
    expect(await store.getReport("missing")).toBeUndefined();
    expect(await store.getIdea("missing")).toBeUndefined();
  });

  it("lists ideas newest first", async () => {
    const a = await store.createIdea("first");
    const b = await store.createIdea("second");
    const list = await store.listIdeas();
    expect(list.map((x) => x.id)).toEqual([b.id, a.id]);
  });
});
