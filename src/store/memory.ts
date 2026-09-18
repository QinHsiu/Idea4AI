import { runPipeline } from "@/engine/pipeline";
import type { FixtureName } from "@/engine/mock/selectFixture";
import type { Idea, MemoryStore, Run } from "./types";

const ids = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function createMemoryStore(): MemoryStore & {
  waitForRun(runId: string): Promise<Run | undefined>;
} {
  const ideas = new Map<string, Idea>();
  const runs = new Map<string, Run>();
  const completions = new Map<string, Promise<Run | undefined>>();

  const store = {
    createIdea(text: string) {
      const id = ids("idea");
      ideas.set(id, { id, text, created_at: new Date().toISOString() });
      return { id };
    },

    startValidate(ideaId: string, fixture?: FixtureName) {
      const idea = ideas.get(ideaId);
      if (!idea) throw new Error("Idea not found");

      const run_id = ids("run");
      runs.set(run_id, { run_id, idea_id: ideaId, status: "running" });
      const completion = runPipeline(idea.text, {
        ideaId,
        mockFixture: fixture,
      })
        .then((report) => {
          const run = runs.get(run_id);
          if (!run) return undefined;
          run.status = "completed";
          run.report = report;
          return run;
        })
        .catch((error: unknown) => {
          const run = runs.get(run_id);
          if (!run) return undefined;
          run.status = "failed";
          run.error = error instanceof Error ? error.message : String(error);
          return run;
        });
      completions.set(run_id, completion);
      void completion.finally(() => completions.delete(run_id));
      return { run_id };
    },

    getRun(runId: string) {
      return runs.get(runId);
    },

    getReport(ideaId: string) {
      return [...runs.values()]
        .reverse()
        .find((run) => run.idea_id === ideaId && run.status === "completed")
        ?.report;
    },

    listIdeas() {
      return [...ideas.values()].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1,
      );
    },

    getLatestRun(ideaId: string) {
      return [...runs.values()]
        .reverse()
        .find((run) => run.idea_id === ideaId);
    },

    getIdea(ideaId: string) {
      return ideas.get(ideaId);
    },

    waitForRun(runId: string) {
      return completions.get(runId) ?? Promise.resolve(runs.get(runId));
    },
  };

  return store;
}

const globalForStore = globalThis as typeof globalThis & {
  __idea4aiMemoryStore?: ReturnType<typeof createMemoryStore>;
};

/** Survive Next.js route recompiles in dev (otherwise Map resets between /api/ideas and /validate). */
export const memoryStore =
  globalForStore.__idea4aiMemoryStore ?? createMemoryStore();

globalForStore.__idea4aiMemoryStore = memoryStore;
