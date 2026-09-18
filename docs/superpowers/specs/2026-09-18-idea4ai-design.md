# Idea4AI Design Spec

**Date:** 2026-09-18  
**Revised:** 2026-09-18 (v6: §3.3 build_gate_fail row; §4 reports reserved keys)  
**Status:** Approved for P0 implementation planning  
**Scope:** Vibe coding idea validation only  
**Approach:** B — Validation Engine + multi-surface (Web / MCP / Skill), phased P0 → P1 → P2  
**Borrowing meaning:** Capability mapping into engine modules (not 1:1 product clones; not code ports).  
**Implementation status:** **Code not started.** P0 modules (`clarify`, `audience` lite, `novelty_guard`, `scorecard`, `verdict`, `report`) exist only as this design until the P0 implementation plan is executed.

### Borrow completeness bar

| Level | Meaning | Idea4AI target |
|---|---|---|
| Design mapping | Capability appears in §7 with status | Done in this spec |
| Schema + AC | Inputs/outputs + tests locked | Required before coding each absorb (see §12) |
| Code shipped | Module passes AC tests | Not started |
| Feature parity | Clone every upstream feature | **Not a goal** |

`partial` / `defer` rows are **intentional**, not unfinished bookkeeping:

- **partial** = vibe-relevant subset only (e.g. experiment library ⊂ 44; Lean Canvas in P2; PMF Kit → `pmf` + decision, not full Spec-Kit).  
- **defer** = out of default path (multi-agent parallel + Opus synth, Impact Compass pure stats).  
- Success = every `absorb`/`partial` row has schema + AC when its phase starts; not that every upstream repo is reimplemented.

## 1. Goals and non-goals

### Goals

- Help solo / small-team builders validate **vibe coding** product ideas before investing build time.
- Ship a **Web-first** product that also embeds into **Cursor / Claude** via MCP and Agent Skill (same backend).
- Absorb **capabilities** from the landscape in `../s.txt`—mapped explicitly in §7—not clone brands or paywalled UIs.

### Non-goals (explicit)

| Item | Rationale |
|---|---|
| Idea generation / brainstorm-to-idea factories | Product validates given ideas; does not invent startups |
| Naming generators | Out of scope |
| Heavy TAM / SAM / SOM modeling | Costly, low signal for vibe MVPs |
| External commercial tool recommender (Validator AI, DimeADozen, …) | Avoid affiliate/catalog product; keep validation in-house |
| CLI-local-first as primary surface | Architecture choice: Web + MCP/Skill |
| Cloning commercial paywalled UI/UX | Legal/product risk; we take capabilities only |
| Native mobile/desktop apps | Responsive Web is enough |
| General fundraising diligence / full PE shop | Not vibe-coding validation |

### Explicitly deferred / optional (not non-goals forever)

| Item | Status |
|---|---|
| Multi-agent parallel orchestration + synthesis | **Optional / later** — see §3.4 |
| Pure statistical / deterministic validator (Impact Compass style) | **Optional / later** — see §3.5 |
| Investor attack simulation | **P2 optional** |

## 2. Architecture

```text
Web App ──┐
MCP Server ├──► Validation API ──► Validation Engine ──► LLM / Evidence / Signals
Agent Skill┘
```

P0–P1 default execution is a **serial pipeline** (predictable cost/latency). Parallel multi-agent is an **optional execution mode**, not the default (see §3.4).

### Engine modules

| Module | Responsibility | Phase |
|---|---|---|
| `clarify` | Structure raw idea: who / pain / artifact / why now | P0 |
| `audience` | Target-audience & market slice analysis (report section) | P0 (lite) → P1 |
| `novelty_guard` | Reject vague “AI-powered X”; collision signals | P0 |
| `scorecard` | 8-dim scores + weights → verdict | P0 |
| `monetization` | Monetization / pricing lite (not TAM) | P1 |
| `pmf` | Independent PMF lite diagnosis | P1 |
| `report` | Auditable report with evidence grades | P0 |
| `experiments` | RAT + ≤2 weeks ≤$100 experiment cards | P2 |
| `canvas` | Lean Canvas / JTBD lite + SWOT lite | P2 |
| `pestle` | PESTLE lite (macro factors for vibe products) | P2 |
| `multi_agent` | Parallel specialist agents + synthesizer | Optional later |
| `stats` | Deterministic / statistical checks | Optional later |

## 3. Validation pipeline and scoring

### 3.1 Default pipeline (serial)

1. Ingest raw idea text  
2. `clarify` → structured statement (+ optional 2–4 Web follow-ups)  
3. `audience` → primary/secondary persona + reachability notes  
4. `novelty_guard` → rewrite gate or hard fail on empty templates  
5. `scorecard` → 8 dims + weighted composite  
6. `monetization` (P1+) → pricing hypotheses + revenue shape  
7. `pmf` (P1+) → PMF lite status + gaps  
8. `verdict` ∈ { kill, pivot, test, build } (uses scorecard + novelty; PMF/monetization can **downgrade** but not alone upgrade to `build`)  
9. `report` → all sections + evidence (L0–L3) + next actions  
10. P2 add-ons: `experiments`, `canvas`, `pestle`

### 3.2 Score dimensions and normalization

Canonical **8 dimensions** (vibe coding). Sources with 14 / 10 / 6 dims are **mapped into** these 8—never run as parallel competing score systems in P0–P2.

| Idea4AI dim | Absorbs from landscape (examples) | Default weight |
|---|---|---|
| **Pain** | Pain intensity, problem severity, JTBD struggle | 0.15 |
| **Urgency** | Urgency, timing, “why now” | 0.10 |
| **Differentiation** | Solution gap, novelty vs templates/open-source/Cursor plugins | 0.15 |
| **Buildability** | Technical feasibility, MVP in 2–6 weeks with AI stack | 0.15 |
| **Distribution** | Channel access, indie distribution realism | 0.15 |
| **Willingness** | WTP, monetization signal, pricing acceptance | 0.10 |
| **Competition** | Crowding, substitutes, switching cost | 0.10 |
| **FounderFit** | Solo/AI-stack fit, skills, maintainability | 0.10 |

Weights sum to **1.00**. Composite = Σ (dim_score × weight) with each dim_score in 0–100.

**Merge / drop rules**

| Source-style factor | Treatment |
|---|---|
| Regulatory / PESTLE political-legal | **Dropped from 8-dim**; handled in `pestle` (P2), not scorecard |
| Full SWOT cells | **Dropped from 8-dim**; SWOT lite in `canvas` (P2) |
| “Evidence quality” as a score dim | **Not a dim**; cross-cutting via evidence grades L0–L3 |
| Team size / hiring | Folded into **FounderFit** (solo bias) |
| Capital intensity | Folded into **Buildability** + **Willingness** |
| Fluenta-style “funding signal” | See **§3.2.1** fold table; not a 9th dim |
| Trigvale extra dims beyond mapping | Must map to nearest of 8 or go to report narrative—**no 9th dim in P0–P2** |

**Config:** weights live in `engine/scorecard/weights.json` (overridable per env); golden tests lock default weights.

#### 3.2.1 Fluenta 6 demand signals → 8 dims (locked fold)

Fluenta-style signals are **first-class intermediate fields**, then folded into dims + `signal_notes`. They never appear as extra scorecard columns in the UI.

| Fluenta signal (`id`) | Meaning (vibe) | Folds into dim(s) | Also written to |
|---|---|---|---|
| `demand` | Evidence people want this class of tool | **Pain** (0.6) + **Willingness** (0.4) | `signal_notes.demand` |
| `pain` | Intensity/specificity of the pain | **Pain** (1.0) | `signal_notes.pain` |
| `competition` | Crowding / substitutes | **Competition** (1.0) | `signal_notes.competition` |
| `funding` | Capital/hype around space (weak for indie) | **Willingness** (0.5) + **Competition** (0.5) | `signal_notes.funding` |
| `urgency` | Why-now / time pressure | **Urgency** (1.0) | `signal_notes.urgency` |
| `distribution` *(mapped from Fluenta “reach/渠道” if present; else derived)* | Reachability of buyers | **Distribution** (1.0) | `signal_notes.distribution` |

**Fold math (per dim):**  
`dim_raw = clamp(0,100, weighted average of contributing signal scores)`.  
If a signal is `null` (unknown), omit from that dim’s average; do not invent.  
After fold, normal `scorecard` weights (§3.2) produce `composite`.

**Required output fields** (on every P0+ run that completes scorecard):

```json
{
  "demand_signals": {
    "demand": { "score": 0, "confidence": 0, "evidence_ids": [] },
    "pain": { "score": 0, "confidence": 0, "evidence_ids": [] },
    "competition": { "score": 0, "confidence": 0, "evidence_ids": [] },
    "funding": { "score": 0, "confidence": 0, "evidence_ids": [] },
    "urgency": { "score": 0, "confidence": 0, "evidence_ids": [] },
    "distribution": { "score": 0, "confidence": 0, "evidence_ids": [] }
  },
  "signal_notes": {
    "demand": "string",
    "pain": "string",
    "competition": "string",
    "funding": "string",
    "urgency": "string",
    "distribution": "string"
  },
  "dimensions": { "Pain": 0, "Urgency": 0, "Differentiation": 0, "Buildability": 0, "Distribution": 0, "Willingness": 0, "Competition": 0, "FounderFit": 0 },
  "weights": { "...": 0.15 },
  "composite": 0
}
```

`score`/`confidence` ∈ 0–100; `evidence_ids` reference `evidence[]`. Missing signal → `score: null`, `confidence: 0`, note explains unknown.

**AC / tests (lock):**

1. Fixture with all six signals set → each dim receiving folds matches hand-computed weighted average (±0.5).  
2. Fixture with `funding: null` → Willingness/Competition use only non-null contributors; no NaN.  
3. Schema reject if UI/API exposes a 9th dimension key.  
4. Golden: high `pain`+`demand`, low `competition` → Pain/Willingness high, Competition low (directional assert).

### 3.3 Default verdict thresholds

| Verdict | Rule |
|---|---|
| kill | composite &lt; 40, or novelty veto (`novelty_veto` cap) |
| pivot | 40–59, **or** Differentiation &lt; 30, **or** Distribution &lt; 30 (see unify rule below) |
| test | 60–74, and neither Differentiation nor Distribution &lt; 30, and not forced lower by other caps |
| build | composite ≥ 75 **and** Buildability ≥ 50 **and** Pain ≥ 50; else if composite alone would be `build` but Pain &lt; 50 or Buildability &lt; 50 — **`build_gate_fail` 降级至 `test`**; if P1+ `pmf.status === "weak"` — `pmf_weak_cap` 至多 `test` |

**Unify rule (Differentiation / Distribution):**  
If Differentiation &lt; 30 **or** Distribution &lt; 30, then `verdict = min(computed, pivot)` — i.e. the result is **at most `pivot`**, even when composite alone would yield `test` or `build`. Record `caps_applied: ["diff_or_dist_lt_30"]`.

**Cap application order (deterministic):** `novelty_veto` (force kill) — `diff_or_dist_lt_30` — `build_gate_fail` — `pmf_weak_cap` (P1+). Each cap only lowers severity (`build` &gt; `test` &gt; `pivot` &gt; `kill`).

### 3.4 Multi-agent orchestration (optional / later)

**Not in P0–P1 default path.**

When enabled (feature flag `MULTI_AGENT=1`):

- Fan-out specialist agents (e.g. market, competition, feasibility, monetization, risk)  
- Synthesizer merges into the same JSON schemas as serial modules  
- Must not invent extra score dimensions outside the 8  
- Inspired by: mathews-tom parallel sub-agents, TweakIdea parallel evaluators + Opus synth, Founder Intelligence 6-agent—**capability only**

### 3.5 Deterministic / statistical module (optional / later)

**Not required for P0–P2 MVP.** Future `stats` module may add non-LLM checks (keyword collision counts, simple frequency heuristics). Never replaces evidence grades or verdict policy alone.

### 3.6 Evidence grades

- **L0** model inference · **L1** user-stated · **L2** public page/list · **L3** reproducible retrieval (P1+)  
- Claims without URL must not be graded ≥ L2.

## 4. Tech stack and data model

| Layer | Choice |
|---|---|
| Web | Next.js (App Router), responsive UI |
| API | Next.js Route Handlers in-repo |
| Data / Auth | Supabase (Postgres, Auth, Storage) |
| Deploy | Vercel |
| LLM | Provider-abstracted; `MOCK_LLM=1` for UI/CI |

### Tables

- `profiles` — user profile linked to Supabase Auth  
- `ideas` — raw text, clarified JSON, status (`draft|running|done|failed`)  
- `runs` — pipeline version, model, flags (`multi_agent`), timing, errors  
- `scorecards` — 8 dims, weights snapshot, composite, verdict  
- `audience_profiles` — primary/secondary audience JSON (P0+)  
- `monetization_notes` — pricing hypotheses (P1+)  
- `pmf_assessments` — PMF lite result (P1+)  
- `evidence` — claim, source, grade, links  
- `reports` — markdown/JSON snapshot of full `ValidationReport` (must include **all** §12.6 reserved keys: `monetization`, `pmf`, `experiments`, `canvas`, `pestle`, `pitch`; P0 values are `null`)  
- Optional normalized tables for P1+ (`monetization_notes`, `pmf_assessments`, …) remain projections of the same report keys — not a second schema

### P0 API

- `POST /api/ideas`  
- `POST /api/ideas/:id/validate` → `run_id`  
- `GET /api/runs/:id`  
- `GET /api/ideas/:id/report`  

P1: API keys for MCP/Skill; `quick_check` endpoint (clarify + novelty + coarse score only).

## 5. Surfaces

### Web (P0)

| Route | Purpose |
|---|---|
| `/` | Landing + CTA |
| `/validate` | Input → optional clarify → start run |
| `/ideas` | History |
| `/ideas/[id]` | Report (see structure below) |
| `/settings` | Account / LLM; P1 API keys |

### Report structure (target)

1. Verdict banner + composite  
2. 8-dim scorecard (weights visible on hover/expand)  
3. Clarified statement  
4. **Audience** (primary/secondary, reachability)  
5. Novelty / collision notes  
6. **Monetization lite** (P1+)  
7. **PMF lite** (P1+)  
8. Evidence list (L0–L3)  
9. Next actions (P0: 3 bullets; P2: experiment cards)  
10. P2: Canvas / SWOT lite / PESTLE lite  

### MCP tools (P1)

`validate_idea`, `get_report`, `quick_check`, `list_ideas`.

### Agent Skill (P1)

`/idea4ai` or NL trigger; must run novelty + scorecard; link to Web report when available.

## 6. Phased roadmap

### P0 — Web + Engine core

`clarify`, `audience` lite, `novelty_guard`, 8-dim `scorecard` + weights, verdict, `report`, history, `MOCK_LLM`.

### P1 — Embed + PMF/monetization + signals

MCP + Skill + API keys; `quick_check`; real-time/deeper retrieval; `monetization` lite; independent `pmf` lite; rewrite suggestions.

### P2 — Experiments + frameworks

`experiments` (RAT / Mom Test / fake door / concierge); Test Card subset; `canvas` (Lean/JTBD/SWOT lite); `pestle` lite; optional light pitch / investor pressure test. **No** heavy TAM engine.

## 7. Full capability matrix from `s.txt`

**Status legend:** `absorb` = build into Idea4AI · `non_goal` = will not implement · `defer` = optional/later · `partial` = lite subset only

| Source project | Core capability | Status | Module / surface | Phase | Notes |
|---|---|---|---|---|---|
| Venture Analyst | Market evidence, competitors, feasibility, 3 experiments | absorb | novelty, scorecard, experiments | P0→P2 | Experiments full in P2 |
| Idea OS | Competitor/market/customer discovery, PMF score | absorb | audience, pmf, scorecard | P0→P1 | PMF as own module P1 |
| idea-validation-agents | Brainstorm→validate→GTM, RAT ≤2w ≤$100 | partial | experiments, report | P2 | **No** idea brainstorm factory |
| novel-idea-hunter | Evidence-first; reject generic AI-powered X | absorb | novelty_guard | P0 | |
| testing-business-ideas-skill | 44 experiments, Test Cards, persevere/pivot/kill | partial | experiments | P2 | Vibe-relevant subset only |
| AIdeator | Structured report: demand, competition, risk | absorb | report, scorecard | P0 | |
| project-idea-validator | Competitor teardown, brutal honesty | absorb | novelty, competition dim | P0 | |
| idea-validator (luongnv89) | Critical eval + strengthen proposals | absorb | report next-actions, rewrites | P1 | |
| idea-validator (mathews-tom) | Parallel sub-agents; Lean/JTBD; SWOT/PESTLE | partial + defer | canvas, pestle; multi_agent | P2 / defer | Parallel agents = defer |
| sales-idea-validation | Guide choice of external validators | **non_goal** | — | — | No external tool catalog |
| product-market-fit skill | Measure/diagnose PMF | absorb | `pmf` | P1 | Independent module |
| idea-reality-mcp | GitHub/npm/PyPI/HN scan; 0–100 reality | absorb | novelty + signals | P0→P1 | Depth grows P1 |
| Business Idea Validator MCP | Live research, go/no-go, validate/quick-check | absorb | API + `quick_check` | P0→P1 | |
| Ara MCP | Capture, research, score, Lean Canvas | partial | scorecard, canvas | P0→P2 | Canvas P2 |
| Trigvale MCP | 10-dim card; kill/pivot/test/build | absorb | scorecard (mapped to 8) | P0 | See §3.2 |
| Fluenta MCP | 6 demand signals | absorb | mapped into 8 dims + notes | P0 | |
| Apify Actor Idea Validator | Auditable evidence store | absorb | evidence | P0 | |
| validate-idea / Prove | 5-stage local dialogue | absorb | clarify (+ Web Qs) | P0 | Not CLI-primary |
| TweakIdea | 14 weighted dims; parallel Sonnet + Opus synth; 3 rewrites | partial + defer | scorecard map; rewrites; multi_agent | P0 / P1 / defer | Parallel = defer |
| LaunchLens | Instant judgment, market, competitors | absorb | scorecard, report | P0 | |
| Impact Compass | Pure statistical deterministic CLI | **defer** | `stats` | later | Optional |
| PMF Kit | Spec → research → evidence → decision | partial | pmf + report decision | P1→P2 | Spec export later |
| AI Idea Validator (vat-sa-l) | Demand, competitors, monetization, pain, readiness | absorb | audience, monetization, scorecard | P0→P1 | |
| Founder Intelligence Engine | 6-agent; monetization; MVP; investor attack | partial + defer | monetization; multi_agent; pressure | P1 / defer / P2 opt | |
| AI Idea Validator (ashankgupta) | Gemini eval; pitch; visual scores | partial | scorecard UI; pitch optional | P0 / P2 opt | |
| Startup Validator Agent | Full-stack validator combo | absorb (pattern) | Web architecture | P0 | Pattern only |
| ai-research-platform | FastAPI deep research | partial | retrieval signals | P1 | Not separate research SaaS |
| Validator AI | Web idea feedback / generation | **non_goal** (gen) / partial (feedback pattern) | report UX | — | No idea generation |
| FounderPal | Audience + relevance % | absorb | audience | P0 | |
| DimeADozen | Overview; risk; monetization; market | partial | monetization, report | P1 | No paid-wall clone |
| Inodash | Target audience & market analysis | absorb | audience | P0 | |
| IdeaProof | TAM/SAM/SOM + SWOT | **non_goal** (TAM) / partial (SWOT) | canvas SWOT lite | P2 | |
| Preuve AI | Claims linked to live sources | absorb | evidence L2+ | P1 | |
| Foundra.ai | Validator + pitch + naming | **non_goal** (naming) / partial (pitch) | pitch optional | P2 opt | |
| BizChecker / Trend Seeker | Assorted commercial validators | **non_goal** | — | — | No catalog integration |
| CLI tools as primary UX | Local-first CLI product | **non_goal** | — | — | MCP/Skill instead |
| Commercial paywalled UI clone | Copy SaaS screens | **non_goal** | — | — | |

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated “evidence” | Mandatory L0–L3; no ≥L2 without URL |
| Vague ideas scoring high | Novelty veto + rewrite gate |
| Dimension sprawl (14 vs 10 vs 8) | Single canonical 8 + explicit map (§3.2) |
| LLM cost | `quick_check` vs full; async jobs; mock; multi-agent off by default |
| API key leak (P1) | Hash storage, revoke, rate limits |
| Scope creep | §1 non-goals + §7 `non_goal` rows |

## 9. Testing (P0 minimum)

- Unit + contract per **§12** (schemas, Fluenta fold, verdict table, novelty fixtures)  
- Golden ideas: expected kill / test / build each  
- Web E2E smoke with `MOCK_LLM=1`  
- P0 not “done” until §12.7 checklist is checked

## 10. Repository layout (target)

```text
Idea4AI/
  apps/web/
  packages/engine/     # modules + scorecard/weights.json
  mcp/                 # P1
  skills/idea4ai/      # P1
  docs/superpowers/
```

P0 may keep engine inside `apps/web` and extract when MCP lands.

## 11. Decisions log

| Decision | Choice |
|---|---|
| Form | Web + Cursor/Claude embed |
| Domain | Vibe coding only |
| Architecture | Shared engine + multi-surface; **serial default** |
| Scoring | Canonical 8 dims + weights; map 14/10/6 into them |
| Fluenta 6 signals | Intermediate `demand_signals` + fold math §3.2.1; not extra UI dims |
| PMF | Independent `pmf` module (P1), not only a decision blurb |
| Monetization | Lite module (P1); heavy TAM still non-goal |
| Audience | Report section via `audience` (P0 lite) |
| PESTLE | Lite in P2 via `pestle` |
| Multi-agent / pure stats | Deferred optional |
| External tool recommender / naming / idea gen / CLI-primary | Non-goals |
| Partial/defer | Intentional vibe subset / later — not parity debt |
| Delivery | P0 → P1 → P2 |
| Stack | Next.js + Supabase + Vercel + pluggable LLM |
| Code | Not started until P0 plan execution |
| ClarifiedIdea.low_specificity | Required boolean (v4) |
| L2+/L3 URL | Zod refine on hints + evidence |
| Evidence ids | `ev_<run_short>_<seq>`; `run_short` = alnum(run_id)[:8]; regex `^ev_[a-z0-9]{8}_\d{3}$` |
| MOCK_LLM | Fixed fixtures; readable `mock_<fixture>_<hash12>` run_id |
| caps_applied | Closed enum: novelty_veto, diff_or_dist_lt_30, pmf_weak_cap, build_gate_fail |
| evidence_ids refine | Report assemble only — not scorecard unit tests |
| ExperimentCard | P2 Zod `.max(14)` / `.max(100)` when module ships |
| Module I/O | §12.0 table; audience←clarify; novelty←clarify+audience |
| Verdict cap | Differentiation/Distribution &lt; 30 ⇒ at most pivot |
| P1/P2 keys | Reserved null placeholders on ValidationReport |

## 12. P0 schemas and acceptance criteria (must pass before “P0 done”)

Machine-readable Zod (or equivalent) schemas live under `packages/engine/schemas/` once coded. Below is the contract.

### 12.0 Module I/O (explicit data contracts)

Pipeline order matches §3.1. Each step **must** consume the listed inputs; optional inputs marked *(opt)*.

| Step | Module | Consumes | Produces | Notes |
|---|---|---|---|---|
| 1 | ingest | raw `idea_text`, `idea_id` | `IdeaInput` | Reject empty/whitespace |
| 2 | `clarify` | `IdeaInput` | `ClarifiedIdea` | Does not need audience |
| 3 | `audience` | `IdeaInput` + **`ClarifiedIdea`** | `AudienceProfile` | **Must** use `who`/`pain`/`artifact` from clarify |
| 4 | `novelty_guard` | `IdeaInput` + **`ClarifiedIdea`** + **`AudienceProfile`** *(opt for scoring hints)* | `NoveltyResult` | Uses `one_liner`, `low_specificity`, `non_audience`; audience optional only if clarify failed soft-path — P0 always passes audience |
| 5 | `scorecard` | `ClarifiedIdea` + `AudienceProfile` + `NoveltyResult` | `ScorecardResult` | If `novelty.veto`, may still score for diagnostics but verdict forced kill |
| 6 | `verdict` | `ScorecardResult` + `NoveltyResult` (+ P1 `pmf` *(opt)*) | `VerdictResult` | Pure function of scores + caps; no LLM |
| 7 | `report` | all prior outputs + `evidence[]` | `ValidationReport` | Assembles only; does not re-score |

**Evidence attachment:** any module may append to a shared `evidence[]` accumulator during the run.  
`scorecard.demand_signals.*.evidence_ids` may reference ids that are **intended** to exist by report time.  
**Existence refine (`evidence_ids` ⊆ `evidence[].id`) runs only when assembling / parsing `ValidationReport`** — not inside the `scorecard` module unit tests. Scorecard tests may use stub ids without a full evidence array.

### 12.1 `clarify` → `ClarifiedIdea`

```ts
{
  who: string;
  pain: string;
  artifact: string;
  why_now: string;
  one_liner: string;        // ≤ 160 chars
  assumptions: string[];    // ≤ 5
  low_specificity: boolean; // true when idea is generic / underspecified
}
```

**AC:** empty raw input rejected; generic “AI app for everyone” → structured fields **and** `low_specificity: true`; niche specific idea → `low_specificity: false`; snapshot test on 3 fixtures.

### 12.2 `audience` lite → `AudienceProfile`

```ts
{
  primary: { persona: string; context: string; reachability: "high"|"mid"|"low"; notes: string };
  secondary?: { persona: string; context: string; reachability: "high"|"mid"|"low"; notes: string };
  non_audience: string[];
}
```

**AC:** always present on report; `reachability` enum enforced; uses clarify.`who` as default persona seed; indie B2C golden has `non_audience` non-empty.

### 12.3 `novelty_guard` → `NoveltyResult`

```ts
{
  veto: boolean;
  reason?: string;
  template_hit: boolean;
  collision_hints: {
    source: string;
    title: string;
    url?: string;
    grade: "L0"|"L1"|"L2"|"L3";
  }[];
  require_rewrite: boolean;
}
```

**Schema refine (Zod `.superRefine`, not test-only):**  
For every `collision_hints[i]`, if `grade` is `L2` or `L3`, then `url` MUST be a non-empty string matching `^https?://`. Otherwise schema parse **fails**. Same refine applies to `ValidationReport.evidence[]`.

**AC:** (a) “AI-powered todo for everyone” → `template_hit` and (`require_rewrite` or `veto`); (b) niche tool → no veto; (c) constructing L2 hint without url throws/returns Zod error.

### 12.4 `scorecard` + fold → `ScorecardResult`

Includes §3.2.1 fields: `demand_signals`, `signal_notes`, `dimensions`, `weights`, `composite`.

**AC:** weights sum 1±1e-6; composite = Σ dim×weight ±0.5; Fluenta fold tests §3.2.1; no keys outside the 8 dims.  
**Not required at scorecard unit level:** `evidence_ids` existence vs `evidence[]` (deferred to report refine, §12.0 / §12.6).

### 12.5 `verdict` → `VerdictResult`

```ts
{
  verdict: "kill"|"pivot"|"test"|"build";
  rationale: string[];
  caps_applied: CapId[];  // closed enum — see table
}
```

#### `caps_applied` enum (frozen names)

| CapId | When applied | Effect |
|---|---|---|
| `novelty_veto` | `novelty.veto === true` | Force `kill` |
| `diff_or_dist_lt_30` | Differentiation &lt; 30 or Distribution &lt; 30 | Cap to at most `pivot` |
| `pmf_weak_cap` | P1+: `pmf.status === "weak"` and `pmf.caps_verdict` | Cap to at most `test` |
| `build_gate_fail` | Composite would be `build` but Pain &lt; 50 or Buildability &lt; 50 | Cap to `test` (or lower if other caps apply) |

Unknown strings in `caps_applied` fail Zod enum parse. P2+ may extend the enum only via spec revision + migration note.

**AC (aligned with §3.3):** table-driven thresholds; novelty `veto` ⇒ `kill` + `novelty_veto`; **if Differentiation &lt; 30 or Distribution &lt; 30 ⇒ verdict is at most `pivot`** + `diff_or_dist_lt_30`.

### 12.6 `report` → `ValidationReport`

#### Evidence id rules

| Rule | Spec |
|---|---|
| `run_short` | Take `run_id`, keep only `[a-z0-9]` (strip `_`, `-`, etc.), then take the **first 8** chars. If fewer than 8 alnum chars, left-pad with `0`. |
| Format | `ev_<run_short>_<seq>` with `seq` = zero-padded 3-digit monotonic int starting `001` |
| Regex (locked) | `^ev_[a-z0-9]{8}_\d{3}$` |
| Example (uuid run) | `run_id=a1b2c3d4-e5f6-...` → `run_short=a1b2c3d4` → `ev_a1b2c3d4_001` |
| Example (mock run) | `run_id=mock_kill_a1b2c3d4e5f6` → alnum filter → `mockkilla1b2c3d4e5f6` → `run_short=mockkill` → `ev_mockkill_001` |
| Stability | Within a single `run_id`, ids assigned in append order and **never reused**; same mock fixture ⇒ same ids |
| References | `demand_signals.*.evidence_ids` ⊆ `evidence[].id` checked **only** on `ValidationReport` refine (not in scorecard module) |

```ts
{
  idea_id: string;
  run_id: string;
  clarified: ClarifiedIdea;
  audience: AudienceProfile;
  novelty: NoveltyResult;
  scorecard: ScorecardResult;
  verdict: VerdictResult;
  evidence: {
    id: string;             // ^ev_[a-z0-9]{8}_\d{3}$
    claim: string;
    grade: "L0"|"L1"|"L2"|"L3";
    url?: string;           // required if grade ∈ {L2,L3} (Zod refine)
  }[];
  next_actions: string[];   // exactly 3 in P0
  pipeline_version: string; // e.g. "p0.1.0"

  // --- Reserved placeholders (null in P0; names locked for P1/P2 migrations) ---
  monetization: MonetizationLite | null;  // P1
  pmf: PmfLite | null;                    // P1
  experiments: ExperimentCard[] | null;   // P2
  canvas: CanvasLite | null;              // P2
  pestle: PestleLite | null;              // P2
  pitch: string | null;                   // P2 optional
}
```

#### Reserved P1/P2 field shapes (placeholders — implement later, names frozen)

```ts
// P1
type MonetizationLite = {
  model: "subscription"|"usage"|"one_time"|"freemium"|"marketplace"|"other";
  price_hypothesis: string;
  revenue_notes: string;
  willingness_link: string;
};

type PmfLite = {
  status: "strong"|"mixed"|"weak"|"unknown";
  signals: string[];
  gaps: string[];
  caps_verdict: boolean;
};

// P2 — Zod must enforce .max on duration/budget when module ships
type ExperimentCard = {
  name: string;
  type: "mom_test"|"fake_door"|"concierge"|"rat"|"other";
  duration_days: number;     // Zod: .int().min(1).max(14)  — RAT pack default
  budget_usd: number;        // Zod: .min(0).max(100)     — RAT pack default
  success_metric: string;
};
```

**P2 schema lock (when `experiments` lands):** `duration_days ≤ 14` and `budget_usd ≤ 100` MUST be Zod `.max()` constraints (not comment-only), so the “≤2 weeks ≤$100” RAT promise is test-enforced. Cards outside that envelope use `type: "other"` **and** still fail default-pack validation unless an explicit `pack: "extended"` flag is added in a future spec revision.

```ts
type CanvasLite = {
  lean: Record<string, string>;
  jtbd: { job: string; situation: string; outcome: string };
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
};

type PestleLite = {
  political: string;
  economic: string;
  social: string;
  technological: string;
  legal: string;
  environmental: string;
};
```

#### `MOCK_LLM=1` output contract

When `MOCK_LLM=1` (or `true`):

1. **No** external LLM calls.  
2. Engine selects one of **three fixed fixtures** by hashing normalized `idea_text` into buckets, **or** by explicit `?fixture=kill|test|build` / `X-Mock-Fixture` header in API tests.  
3. Fixtures live at `packages/engine/fixtures/mock_{kill,test,build}.json` and **are** valid `ValidationReport` objects (reserved keys `null`).  
4. `run_id` in mock mode is deterministic and **may keep underscores for readability**: `mock_<fixture>_<sha256(idea_text)[0:12]>` (e.g. `mock_kill_a1b2c3d4e5f6`).  
5. Evidence ids use **`run_short` = alnum-filter then 8 chars** (above), so mock ids stay `^ev_[a-z0-9]{8}_\d{3}$` (e.g. `ev_mockkill_001`).  
6. Golden tests assert **byte-stable** JSON for the three named fixtures (P0 reports have **no** required wall-clock timestamp fields).

**AC:** contract test `validate → report` shape; Web renders P0 sections; mock path yields stable golden verdicts; Zod rejects L2+ without url; evidence id regex holds for mock `run_id`s; reserved keys present and `null` in P0; report refine catches dangling `evidence_ids`.

### 12.7 P0 done checklist

- [ ] Schemas + unit/contract tests green (incl. Zod refines, evidence id refs, mock fixtures)  
- [ ] Web path: create idea → validate → view report  
- [ ] Three golden ideas match expected verdict class  
- [ ] README documents `MOCK_LLM` and env vars  
- [ ] No MCP/Skill required for P0 done  
- [ ] DB/JSON columns reserved for `monetization`, `pmf`, `experiments`, `canvas`, `pestle`, `pitch`