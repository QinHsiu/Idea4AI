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
import { monetizationLite } from "./monetization";
import { pmfLite } from "./pmf";
import { pitchLite, researchLite } from "./research";
import { experimentsLite } from "./experiments";
import { canvasLite } from "./canvas";
import { pestleLite } from "./pestle";
import {
  fetchCollisionHints,
  isRetrievalEnabled,
} from "./retrieval";
import {
  noveltyResultSchema,
  validationReportSchema,
  type ValidationReport,
} from "./schemas";
import { pickFixture, type FixtureName } from "./mock/selectFixture";
import { clarifyWithLlm, scorecardWithLlm } from "./llm/score";
import { resolveLlmMode } from "./llm/provider";
import { deterministicRunId } from "./runId";

export interface PipelineOptions {
  ideaId?: string;
  /** When set (e.g. by store), report.run_id and evidence ids bind to this run. */
  runId?: string;
  mockFixture?: FixtureName;
}

const fixtures = { kill: killFixture, test: testFixture, build: buildFixture } as const;

export async function runPipeline(
  ideaText: string,
  opts: PipelineOptions = {},
): Promise<ValidationReport> {
  const mode = resolveLlmMode();
  if (mode === "mock") {
    const fixtureName = pickFixture(ideaText, opts.mockFixture);
    const report = {
      ...fixtures[fixtureName],
      idea_id: opts.ideaId ?? fixtures[fixtureName].idea_id,
    };
    return validationReportSchema.parse(report);
  }

  const ideaId = opts.ideaId ?? "idea_unknown";
  const runId = opts.runId ?? deterministicRunId(ideaId, ideaText);
  const input = { idea_id: ideaId, idea_text: ideaText };

  const clarified =
    mode === "openai" || mode === "anthropic"
      ? await clarifyWithLlm(ideaText)
      : clarify(input);

  const audienceProfile = audience(input, clarified);
  const evidence = new EvidenceAccumulator(runId);
  let noveltyResult = novelty(input, clarified, audienceProfile, evidence);

  if (isRetrievalEnabled()) {
    const hints = await fetchCollisionHints(ideaText, clarified);
    for (const hint of hints) {
      if (hint.url) {
        evidence.add({
          claim: `Live collision (${hint.source}): ${hint.title}`,
          grade: hint.grade,
          url: hint.url,
        });
      }
    }
    noveltyResult = noveltyResultSchema.parse({
      ...noveltyResult,
      collision_hints: [...noveltyResult.collision_hints, ...hints].slice(0, 6),
    });
  }

  const scored =
    mode === "openai" || mode === "anthropic"
      ? await scorecardWithLlm(
          ideaText,
          clarified,
          audienceProfile,
          noveltyResult,
          evidence,
        )
      : {
          scorecard: scorecard(
            clarified,
            audienceProfile,
            noveltyResult,
            evidence,
          ),
          next_actions: undefined as string[] | undefined,
        };

  const monetization = monetizationLite(
    clarified,
    scored.scorecard,
    ideaText,
  );
  const pmf = pmfLite(clarified, scored.scorecard, noveltyResult);

  const verdict = computeVerdict({
    dimensions: scored.scorecard.dimensions,
    composite: scored.scorecard.composite,
    noveltyVeto: noveltyResult.veto,
    pmfWeak: pmf.caps_verdict,
  });

  const research = await researchLite({
    ideaText,
    clarified,
    audience: audienceProfile,
    novelty: noveltyResult,
    scorecard: scored.scorecard,
    verdict,
  });
  const pitch = pitchLite(clarified, verdict, research);
  const experiments = experimentsLite({
    clarified,
    audience: audienceProfile,
    novelty: noveltyResult,
    verdict,
    pmf,
  });
  const canvas = canvasLite({
    clarified,
    audience: audienceProfile,
    novelty: noveltyResult,
    scorecard: scored.scorecard,
    verdict,
    monetization,
  });
  const pestle = pestleLite({
    clarified,
    novelty: noveltyResult,
    scorecard: scored.scorecard,
    verdict,
  });

  return assembleReport({
    idea_id: ideaId,
    run_id: runId,
    clarified,
    audience: audienceProfile,
    novelty: noveltyResult,
    scorecard: scored.scorecard,
    verdict,
    evidence: evidence.items,
    next_actions: scored.next_actions,
    pipeline_version: process.env.PIPELINE_VERSION ?? "p2.0.0",
    monetization,
    pmf,
    experiments,
    canvas,
    pestle,
    pitch,
    research,
  });
}

export {
  clarify,
  audience,
  novelty,
  scorecard,
  assembleReport,
  monetizationLite,
  pmfLite,
  experimentsLite,
  canvasLite,
  pestleLite,
};
