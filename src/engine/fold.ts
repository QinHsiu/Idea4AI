export const DIMENSIONS = [
  "Pain",
  "Urgency",
  "Differentiation",
  "Buildability",
  "Distribution",
  "Willingness",
  "Competition",
  "FounderFit",
] as const;

export type Dim = (typeof DIMENSIONS)[number];

export type FluentaSignalId =
  | "demand"
  | "pain"
  | "competition"
  | "funding"
  | "urgency"
  | "distribution";

export type FluentaSignalScores = Record<FluentaSignalId, number | null>;

type FoldContribution = { weight: number; score: number };

/** Spec §3.2.1 fold table: signal → dimension weights */
const FOLD_MAP: Record<FluentaSignalId, Partial<Record<Dim, number>>> = {
  demand: { Pain: 0.6, Willingness: 0.4 },
  pain: { Pain: 1.0 },
  competition: { Competition: 1.0 },
  funding: { Willingness: 0.5, Competition: 0.5 },
  urgency: { Urgency: 1.0 },
  distribution: { Distribution: 1.0 },
};

function clamp0to100(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function effectiveWeights(contributions: FoldContribution[]): FoldContribution[] {
  if (contributions.length <= 1) {
    return contributions;
  }

  const fractional = contributions.filter((c) => c.weight < 1);
  const fractionalSum = fractional.reduce((sum, c) => sum + c.weight, 0);

  return contributions.map((c) => {
    if (c.weight >= 1) {
      return { ...c, weight: Math.max(0, 1 - fractionalSum) };
    }
    return c;
  });
}

function foldDimension(contributions: FoldContribution[]): number {
  if (contributions.length === 0) {
    throw new Error("foldDimension called with no contributors");
  }
  if (contributions.length === 1) {
    return clamp0to100(contributions[0].score);
  }

  const adjusted = effectiveWeights(contributions);
  const weightSum = adjusted.reduce((sum, c) => sum + c.weight, 0);
  const weighted =
    adjusted.reduce((sum, c) => sum + c.weight * c.score, 0) / weightSum;

  return clamp0to100(weighted);
}

/**
 * Fold Fluenta 6 demand signals into scorecard dimensions (§3.2.1).
 * Returns only dims with at least one non-null contributor; scorecard merges LLM dims.
 */
export function foldSignalsToDimensions(
  signals: FluentaSignalScores,
): Partial<Record<Dim, number>> {
  const byDim = new Map<Dim, FoldContribution[]>();

  for (const signalId of Object.keys(FOLD_MAP) as FluentaSignalId[]) {
    const score = signals[signalId];
    if (score === null) {
      continue;
    }

    const mapping = FOLD_MAP[signalId];
    for (const dim of Object.keys(mapping) as Dim[]) {
      const weight = mapping[dim];
      if (weight === undefined) {
        continue;
      }
      const list = byDim.get(dim) ?? [];
      list.push({ weight, score });
      byDim.set(dim, list);
    }
  }

  const result: Partial<Record<Dim, number>> = {};
  for (const [dim, contributions] of byDim) {
    result[dim] = foldDimension(contributions);
  }

  return result;
}

/** Composite = Σ (dim_score × weight) per §3.2 */
export function composite(
  dimensions: Partial<Record<Dim, number>>,
  weights: Record<string, number>,
): number {
  let total = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    const score = dimensions[dim as Dim];
    if (score !== undefined) {
      total += score * weight;
    }
  }
  return total;
}
