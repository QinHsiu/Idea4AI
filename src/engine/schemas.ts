import { z } from "zod";

export const capIdSchema = z.enum([
  "novelty_veto",
  "diff_or_dist_lt_30",
  "pmf_weak_cap",
  "build_gate_fail",
]);
export type CapId = z.infer<typeof capIdSchema>;

export const evidenceGradeSchema = z.enum(["L0", "L1", "L2", "L3"]);
export type EvidenceGrade = z.infer<typeof evidenceGradeSchema>;

const HTTP_URL_RE = /^https?:\/\/.+/;

function refineL2L3Url(
  items: { grade: string; url?: string }[],
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
) {
  items.forEach((item, i) => {
    if (item.grade === "L2" || item.grade === "L3") {
      if (!item.url || !HTTP_URL_RE.test(item.url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "L2/L3 requires a non-empty http(s) url",
          path: [...pathPrefix, i, "url"],
        });
      }
    }
  });
}

const demandSignalKeys = [
  "demand",
  "pain",
  "competition",
  "funding",
  "urgency",
  "distribution",
] as const;

const dimensionKeys = [
  "Pain",
  "Urgency",
  "Differentiation",
  "Buildability",
  "Distribution",
  "Willingness",
  "Competition",
  "FounderFit",
] as const;

const demandSignalEntrySchema = z.object({
  score: z.number().min(0).max(100).nullable(),
  confidence: z.number().min(0).max(100),
  evidence_ids: z.array(z.string()),
});

const demandSignalsSchema = z.object(
  Object.fromEntries(
    demandSignalKeys.map((k) => [k, demandSignalEntrySchema]),
  ) as Record<(typeof demandSignalKeys)[number], typeof demandSignalEntrySchema>,
);

const signalNotesSchema = z.object(
  Object.fromEntries(demandSignalKeys.map((k) => [k, z.string()])) as Record<
    (typeof demandSignalKeys)[number],
    z.ZodString
  >,
);

const dimensionsSchema = z.object(
  Object.fromEntries(dimensionKeys.map((k) => [k, z.number().min(0).max(100)])) as Record<
    (typeof dimensionKeys)[number],
    z.ZodNumber
  >,
);

const weightsSchema = z.record(z.string(), z.number());

export const clarifiedIdeaSchema = z.object({
  who: z.string(),
  pain: z.string(),
  artifact: z.string(),
  why_now: z.string(),
  one_liner: z.string().max(160),
  assumptions: z.array(z.string()).max(5),
  low_specificity: z.boolean(),
});
export type ClarifiedIdea = z.infer<typeof clarifiedIdeaSchema>;

const reachabilitySchema = z.enum(["high", "mid", "low"]);

const audienceSegmentSchema = z.object({
  persona: z.string(),
  context: z.string(),
  reachability: reachabilitySchema,
  notes: z.string(),
});

export const audienceProfileSchema = z.object({
  primary: audienceSegmentSchema,
  secondary: audienceSegmentSchema.optional(),
  non_audience: z.array(z.string()),
});
export type AudienceProfile = z.infer<typeof audienceProfileSchema>;

const collisionHintSchema = z.object({
  source: z.string(),
  title: z.string(),
  url: z.string().optional(),
  grade: evidenceGradeSchema,
});

export const noveltyResultSchema = z
  .object({
    veto: z.boolean(),
    reason: z.string().optional(),
    template_hit: z.boolean(),
    collision_hints: z.array(collisionHintSchema),
    require_rewrite: z.boolean(),
  })
  .superRefine((data, ctx) => {
    refineL2L3Url(data.collision_hints, ctx, ["collision_hints"]);
  });
export type NoveltyResult = z.infer<typeof noveltyResultSchema>;

export const scorecardResultSchema = z.object({
  demand_signals: demandSignalsSchema,
  signal_notes: signalNotesSchema,
  dimensions: dimensionsSchema,
  weights: weightsSchema,
  composite: z.number(),
});
export type ScorecardResult = z.infer<typeof scorecardResultSchema>;

export const verdictResultSchema = z.object({
  verdict: z.enum(["kill", "pivot", "test", "build"]),
  rationale: z.array(z.string()),
  caps_applied: z.array(capIdSchema),
});
export type VerdictResult = z.infer<typeof verdictResultSchema>;

export const evidenceItemSchema = z
  .object({
    id: z.string().regex(/^ev_[a-z0-9]{8}_\d{3}$/),
    claim: z.string(),
    grade: evidenceGradeSchema,
    url: z.string().optional(),
  })
  .superRefine((item, ctx) => {
    refineL2L3Url([item], ctx, []);
  });

const monetizationLiteSchema = z.object({
  model: z.enum([
    "subscription",
    "usage",
    "one_time",
    "freemium",
    "marketplace",
    "other",
  ]),
  price_hypothesis: z.string(),
  revenue_notes: z.string(),
  willingness_link: z.string(),
});

const pmfLiteSchema = z.object({
  status: z.enum(["strong", "mixed", "weak", "unknown"]),
  signals: z.array(z.string()),
  gaps: z.array(z.string()),
  caps_verdict: z.boolean(),
});

const experimentCardSchema = z.object({
  name: z.string(),
  type: z.enum(["mom_test", "fake_door", "concierge", "rat", "other"]),
  duration_days: z.number().int().min(1).max(14),
  budget_usd: z.number().min(0).max(100),
  success_metric: z.string(),
});

const canvasLiteSchema = z.object({
  lean: z.record(z.string(), z.string()),
  jtbd: z.object({
    job: z.string(),
    situation: z.string(),
    outcome: z.string(),
  }),
  swot: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
});

const pestleLiteSchema = z.object({
  political: z.string(),
  economic: z.string(),
  social: z.string(),
  technological: z.string(),
  legal: z.string(),
  environmental: z.string(),
});

export const validationReportSchema = z
  .object({
    idea_id: z.string(),
    run_id: z.string(),
    clarified: clarifiedIdeaSchema,
    audience: audienceProfileSchema,
    novelty: noveltyResultSchema,
    scorecard: scorecardResultSchema,
    verdict: verdictResultSchema,
    evidence: z.array(evidenceItemSchema),
    next_actions: z.array(z.string()).length(3),
    pipeline_version: z.string(),
    monetization: monetizationLiteSchema.nullable(),
    pmf: pmfLiteSchema.nullable(),
    experiments: z.array(experimentCardSchema).nullable(),
    canvas: canvasLiteSchema.nullable(),
    pestle: pestleLiteSchema.nullable(),
    pitch: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    refineL2L3Url(data.evidence, ctx, ["evidence"]);

    // Spec §12.6: evidence_ids ⊆ evidence[].id — report assemble only
    const evidenceIdSet = new Set(data.evidence.map((e) => e.id));
    for (const key of demandSignalKeys) {
      const ids = data.scorecard.demand_signals[key].evidence_ids;
      ids.forEach((id, i) => {
        if (!evidenceIdSet.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `evidence_id "${id}" not found in evidence[]`,
            path: ["scorecard", "demand_signals", key, "evidence_ids", i],
          });
        }
      });
    }
  });
export type ValidationReport = z.infer<typeof validationReportSchema>;
