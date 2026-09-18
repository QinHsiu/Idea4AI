import {
  validationReportSchema,
  type AudienceProfile,
  type ClarifiedIdea,
  type NoveltyResult,
  type ScorecardResult,
  type ValidationReport,
  type VerdictResult,
} from "./schemas";

export interface AssembleReportInput {
  idea_id: string;
  run_id: string;
  clarified: ClarifiedIdea;
  audience: AudienceProfile;
  novelty: NoveltyResult;
  scorecard: ScorecardResult;
  verdict: VerdictResult;
  evidence: ValidationReport["evidence"];
  next_actions?: string[];
  pipeline_version?: string;
}

export function assembleReport(input: AssembleReportInput): ValidationReport {
  return validationReportSchema.parse({
    ...input,
    next_actions: input.next_actions ?? [
      "Interview five target users.",
      "Run a focused validation experiment.",
      "Re-run the validator with the results.",
    ],
    pipeline_version: input.pipeline_version ?? "p0.1.0",
    monetization: null,
    pmf: null,
    experiments: null,
    canvas: null,
    pestle: null,
    pitch: null,
  });
}
