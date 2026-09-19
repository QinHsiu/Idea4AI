import type { ValidationReport } from "@/engine/schemas";
import type { FixtureName } from "@/engine/mock/selectFixture";

export type RunStatus = "running" | "completed" | "failed";

export interface Idea {
  id: string;
  text: string;
  created_at: string;
}

export interface Run {
  run_id: string;
  idea_id: string;
  status: RunStatus;
  error?: string;
  report?: ValidationReport;
}

export type StoreBackend = "memory" | "supabase";

/** Shared persistence contract for memory + Supabase backends. */
export interface IdeaStore {
  readonly backend: StoreBackend;
  createIdea(text: string): Promise<{ id: string }>;
  startValidate(ideaId: string, fixture?: FixtureName): Promise<{ run_id: string }>;
  getRun(runId: string): Promise<Run | undefined>;
  getReport(ideaId: string): Promise<ValidationReport | undefined>;
  listIdeas(): Promise<Idea[]>;
  getLatestRun(ideaId: string): Promise<Run | undefined>;
  getIdea(ideaId: string): Promise<Idea | undefined>;
  waitForRun(runId: string): Promise<Run | undefined>;
}

/** @deprecated Prefer IdeaStore — kept as alias for older imports. */
export type MemoryStore = IdeaStore;
