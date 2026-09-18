import buildFixture from "./fixtures/mock_build.json";
import killFixture from "./fixtures/mock_kill.json";
import testFixture from "./fixtures/mock_test.json";
import { clarify } from "./clarify";
import { audience } from "./audience";
import { novelty } from "./novelty";
import { scorecard } from "./scorecard";
import { EvidenceAccumulator } from "./evidence";
import { computeVerdict } from "./verdict";
import { assembleReport } from "./report";
import { validationReportSchema, type ValidationReport } from "./schemas";
import { pickFixture, type FixtureName } from "./mock/selectFixture";

export interface PipelineOptions {
  ideaId?: string;
  mockFixture?: FixtureName;
}

const fixtures = { kill: killFixture, test: testFixture, build: buildFixture } as const;

export async function runPipeline(
  ideaText: string,
  opts: PipelineOptions = {},
): Promise<ValidationReport> {
  const useMock = process.env.MOCK_LLM !== "0";
  if (useMock) {
    const fixtureName = pickFixture(ideaText, opts.mockFixture);
    const report = {
      ...fixtures[fixtureName],
      idea_id: opts.ideaId ?? fixtures[fixtureName].idea_id,
    };
    return validationReportSchema.parse(report);
  }

  const ideaId = opts.ideaId ?? "idea_unknown";
  const runId = `run_${Date.now().toString(36)}`;
  const input = { idea_id: ideaId, idea_text: ideaText };
  const clarified = clarify(input);
  const audienceProfile = audience(input, clarified);
  const evidence = new EvidenceAccumulator(runId);
  const noveltyResult = novelty(input, clarified, audienceProfile, evidence);
  const scorecardResult = scorecard(clarified, audienceProfile, noveltyResult, evidence);
  const verdict = computeVerdict({
    dimensions: scorecardResult.dimensions,
    composite: scorecardResult.composite,
    noveltyVeto: noveltyResult.veto,
  });
  return assembleReport({
    idea_id: ideaId,
    run_id: runId,
    clarified,
    audience: audienceProfile,
    novelty: noveltyResult,
    scorecard: scorecardResult,
    verdict,
    evidence: evidence.items,
  });
}

export { clarify, audience, novelty, scorecard, assembleReport };
