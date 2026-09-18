import type { CapId, ScorecardResult, VerdictResult } from "./schemas";

type Dimensions = ScorecardResult["dimensions"];
type Verdict = VerdictResult["verdict"];

const SEVERITY: Record<Verdict, number> = {
  kill: 0,
  pivot: 1,
  test: 2,
  build: 3,
};

export interface VerdictInput {
  dimensions: Dimensions;
  composite: number;
  noveltyVeto: boolean;
  pmfWeak?: boolean;
}

function minVerdict(a: Verdict, b: Verdict): Verdict {
  return SEVERITY[a] <= SEVERITY[b] ? a : b;
}

function baseVerdictFromComposite(composite: number): Verdict {
  if (composite < 40) return "kill";
  if (composite < 60) return "pivot";
  if (composite < 75) return "test";
  return "build";
}

export function computeVerdict(input: VerdictInput): VerdictResult {
  const { dimensions, composite, noveltyVeto, pmfWeak = false } = input;
  const caps: CapId[] = [];
  const rationale: string[] = [];

  let verdict = baseVerdictFromComposite(composite);
  rationale.push(`Composite ${composite} → base ${verdict}`);

  if (noveltyVeto) {
    caps.push("novelty_veto");
    verdict = minVerdict(verdict, "kill");
    rationale.push("Novelty veto forces kill");
  }

  if (dimensions.Differentiation < 30 || dimensions.Distribution < 30) {
    caps.push("diff_or_dist_lt_30");
    verdict = minVerdict(verdict, "pivot");
    rationale.push("Differentiation or Distribution below 30 caps to pivot");
  }

  const wouldBuild = composite >= 75;
  if (wouldBuild && (dimensions.Pain < 50 || dimensions.Buildability < 50)) {
    caps.push("build_gate_fail");
    verdict = minVerdict(verdict, "test");
    rationale.push("Build gates failed (Pain or Buildability below 50)");
  }

  if (pmfWeak) {
    caps.push("pmf_weak_cap");
    verdict = minVerdict(verdict, "test");
    rationale.push("Weak PMF caps verdict to test");
  }

  return { verdict, rationale, caps_applied: caps };
}
