# Idea4AI Design Spec

**Date:** 2026-09-18  
**Revised:** 2026-09-18 (gap closure: full s.txt matrix, dimension weights, PMF/monetization/audience/PESTLE)  
**Status:** Pending user re-review after gap closure  
**Scope:** Vibe coding idea validation only  
**Approach:** B — Validation Engine + multi-surface (Web / MCP / Skill), phased P0 → P1 → P2  
**Borrowing meaning:** Capability mapping into engine modules (not 1:1 product clones; not code ports).

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
| Fluenta-style “funding signal” | Folded into **Willingness** / **Competition** notes; not separate dim |
| Trigvale extra dims beyond mapping | Must map to nearest of 8 or go to report narrative—**no 9th dim in P0–P2** |

**Config:** weights live in `engine/scorecard/weights.json` (overridable per env); golden tests lock default weights.

### 3.3 Default verdict thresholds

| Verdict | Rule |
|---|---|
| kill | composite < 40, or novelty veto |
| pivot | 40–59, or Differentiation/Distribution critically low (< 30) |
| test | 60–74 |
| build | ≥ 75 **and** Buildability ≥ 50 **and** Pain ≥ 50; if `pmf` status is `weak`, cap at `test` |

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
- `reports` — markdown/JSON snapshot  

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

- Unit: verdict thresholds, novelty templates, evidence grades, **weight sum = 1**, dimension map fixtures  
- Contract: validate → run → report JSON schema (includes audience section)  
- Golden ideas: expected kill / test / build each  
- Web E2E smoke with `MOCK_LLM=1`

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
| PMF | Independent `pmf` module (P1), not only a decision blurb |
| Monetization | Lite module (P1); heavy TAM still non-goal |
| Audience | Report section via `audience` (P0 lite) |
| PESTLE | Lite in P2 via `pestle` |
| Multi-agent / pure stats | Deferred optional |
| External tool recommender / naming / idea gen / CLI-primary | Non-goals |
| Delivery | P0 → P1 → P2 |
| Stack | Next.js + Supabase + Vercel + pluggable LLM |
