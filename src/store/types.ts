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

export interface MemoryStore {
  createIdea(text: string): { id: string };
  startValidate(ideaId: string, fixture?: FixtureName): { run_id: string };
  getRun(runId: string): Run | undefined;
  getReport(ideaId: string): ValidationReport | undefined;
  listIdeas(): Idea[];
  getLatestRun(ideaId: string): Run | undefined;
  getIdea(ideaId: string): Idea | undefined;
}
