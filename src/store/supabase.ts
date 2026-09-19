import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runPipeline } from "@/engine/pipeline";
import { validationReportSchema, type ValidationReport } from "@/engine/schemas";
import type { FixtureName } from "@/engine/mock/selectFixture";
import type { Idea, IdeaStore, Run, RunStatus } from "./types";

const ids = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function isSupabaseConfigured(): boolean {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key);
}

function getAdminClient(): SupabaseClient {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapRunRow(row: {
  id: string;
  idea_id: string;
  status: string;
  error: string | null;
  report?: ValidationReport | null;
}): Run {
  return {
    run_id: row.id,
    idea_id: row.idea_id,
    status: row.status as RunStatus,
    error: row.error ?? undefined,
    report: row.report ?? undefined,
  };
}

export function createSupabaseStore(
  client: SupabaseClient = getAdminClient(),
): IdeaStore {
  const completions = new Map<string, Promise<Run | undefined>>();

  async function attachReport(run: Run): Promise<Run> {
    if (run.status !== "completed") return run;
    const { data } = await client
      .from("reports")
      .select("payload")
      .eq("idea_id", run.idea_id)
      .eq("run_id", run.run_id)
      .maybeSingle();
    if (!data?.payload) return run;
    return {
      ...run,
      report: validationReportSchema.parse(data.payload),
    };
  }

  const store: IdeaStore = {
    backend: "supabase",

    async createIdea(text: string) {
      const id = ids("idea");
      const { error } = await client.from("ideas").insert({
        id,
        text,
        status: "draft",
      });
      if (error) throw new Error(error.message);
      return { id };
    },

    async startValidate(ideaId: string, fixture?: FixtureName) {
      const { data: idea, error: ideaErr } = await client
        .from("ideas")
        .select("id, text")
        .eq("id", ideaId)
        .maybeSingle();
      if (ideaErr) throw new Error(ideaErr.message);
      if (!idea) throw new Error("Idea not found");

      const run_id = ids("run");
      const { error: runErr } = await client.from("runs").insert({
        id: run_id,
        idea_id: ideaId,
        status: "running",
      });
      if (runErr) throw new Error(runErr.message);

      await client
        .from("ideas")
        .update({ status: "running" })
        .eq("id", ideaId);

      const completion = (async (): Promise<Run | undefined> => {
        try {
          const report = await runPipeline(idea.text, {
            ideaId,
            runId: run_id,
            mockFixture: fixture,
          });
          const { error: reportErr } = await client.from("reports").upsert({
            idea_id: ideaId,
            run_id,
            payload: report,
          });
          if (reportErr) throw new Error(reportErr.message);

          const { error: doneErr } = await client
            .from("runs")
            .update({ status: "completed", error: null })
            .eq("id", run_id);
          if (doneErr) throw new Error(doneErr.message);

          await client
            .from("ideas")
            .update({ status: "completed" })
            .eq("id", ideaId);

          return {
            run_id,
            idea_id: ideaId,
            status: "completed",
            report,
          };
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          await client
            .from("runs")
            .update({ status: "failed", error: message })
            .eq("id", run_id);
          await client
            .from("ideas")
            .update({ status: "failed" })
            .eq("id", ideaId);
          return {
            run_id,
            idea_id: ideaId,
            status: "failed",
            error: message,
          };
        }
      })();

      completions.set(run_id, completion);
      void completion.finally(() => completions.delete(run_id));
      return { run_id };
    },

    async getRun(runId: string) {
      const pending = completions.get(runId);
      if (pending) {
        const done = await pending;
        if (done) return done;
      }
      const { data, error } = await client
        .from("runs")
        .select("id, idea_id, status, error")
        .eq("id", runId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return undefined;
      return attachReport(mapRunRow(data));
    },

    async getReport(ideaId: string) {
      const { data, error } = await client
        .from("reports")
        .select("payload")
        .eq("idea_id", ideaId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data?.payload) return undefined;
      return validationReportSchema.parse(data.payload);
    },

    async listIdeas() {
      const { data, error } = await client
        .from("ideas")
        .select("id, text, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Idea[];
    },

    async getLatestRun(ideaId: string) {
      const { data, error } = await client
        .from("runs")
        .select("id, idea_id, status, error")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return undefined;
      return attachReport(mapRunRow(data));
    },

    async getIdea(ideaId: string) {
      const { data, error } = await client
        .from("ideas")
        .select("id, text, created_at")
        .eq("id", ideaId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Idea | null) ?? undefined;
    },

    waitForRun(runId: string) {
      return (
        completions.get(runId) ??
        store.getRun(runId)
      );
    },
  };

  return store;
}
