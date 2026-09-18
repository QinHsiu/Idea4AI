# Idea4AI Design Spec

**Date:** 2026-09-18  
**Status:** Approved for planning (pending user review of this file)  
**Scope:** Vibe coding idea validation only  
**Approach:** B — Validation Engine + multi-surface (Web / MCP / Skill), phased P0 → P1 → P2

## 1. Goals and non-goals

### Goals

- Help solo / small-team builders validate **vibe coding** product ideas before investing build time.
- Ship a **Web-first** product that also embeds into **Cursor / Claude** via MCP and Agent Skill (same backend).
- Absorb **capabilities** from the landscape in `../s.txt` (skills, MCP, CLI, OSS validators)—not clone brands or paywalled scrapers.

### Non-goals

- General startup consulting, fundraising diligence, or heavy TAM/SAM/SOM modeling (optional light pitch only in P2).
- Replicating closed SaaS UIs (Validator AI, DimeADozen, etc.) feature-for-feature.
- Native mobile/desktop apps (responsive Web is enough).

## 2. Architecture

```text
Web App ──┐
MCP Server ├──► Validation API ──► Validation Engine ──► LLM / Evidence / Signals
Agent Skill┘
```

### Engine modules

| Module | Responsibility | Phase |
|---|---|---|
| `clarify` | Structure raw idea into who / pain / artifact / why now | P0 |
| `novelty_guard` | Reject vague “AI-powered X”; collision signals | P0 |
| `scorecard` | 8-dimension scores → `kill \| pivot \| test \| build` | P0 |
| `report` | Auditable report with evidence grades | P0 |
| `experiments` | RAT + ≤2 weeks ≤$100 experiment cards | P1–P2 |
| `canvas` | Lean Canvas / JTBD lite | P2 |

## 3. P0 validation pipeline

1. Ingest raw idea text  
2. `clarify` → structured statement (optional 2–4 follow-up questions on Web)  
3. `novelty_guard` → rewrite gate or hard fail on empty templates  
4. `scorecard` → composite 0–100 + per-dimension scores  
5. `verdict` ∈ { kill, pivot, test, build }  
6. `report` → verdict, scores, evidence (L0–L3), next actions (3 bullets in P0)

### Score dimensions (vibe coding)

Pain, Urgency, Differentiation, Buildability, Distribution, Willingness, Competition, FounderFit.

### Default verdict thresholds

| Verdict | Rule |
|---|---|
| kill | composite &lt; 40, or novelty veto |
| pivot | 40–59, or Differentiation/Distribution critically low |
| test | 60–74 |
| build | ≥ 75 and Buildability + Pain at/above median |

### Evidence grades

- **L0** model inference · **L1** user-stated · **L2** public page/list · **L3** reproducible retrieval (P1+)  
- Claims without URL must not be graded ≥ L2.

## 4. Tech stack and data model

| Layer | Choice |
|---|---|
| Web | Next.js (App Router), responsive UI |
| API | Next.js Route Handlers in-repo |
| Data / Auth | Supabase (Postgres, Auth, Storage) |
| Deploy | Vercel |
| LLM | Provider-abstracted (OpenAI or Anthropic first); `MOCK_LLM=1` for UI/CI |

### Tables

- `profiles` — user profile linked to Supabase Auth  
- `ideas` — raw text, clarified JSON, status (`draft|running|done|failed`)  
- `runs` — pipeline version, model, timing, errors  
- `scorecards` — 8 dims, composite, verdict  
- `evidence` — claim, source, grade, links  
- `reports` — markdown/JSON snapshot for shareable view  

### P0 API

- `POST /api/ideas`  
- `POST /api/ideas/:id/validate` → `run_id`  
- `GET /api/runs/:id`  
- `GET /api/ideas/:id/report`  

P1 auth for MCP/Skill: API keys (hashed, revocable, per-user rate limits).

## 5. Surfaces

### Web (P0)

| Route | Purpose |
|---|---|
| `/` | Landing + CTA |
| `/validate` | Input → optional clarify → start run |
| `/ideas` | History |
| `/ideas/[id]` | Report: verdict, scores, statement, evidence, next steps |
| `/settings` | Account / LLM; P1 API keys |

### MCP tools (P1)

`validate_idea`, `get_report`, `quick_check`, `list_ideas` — all call Validation API.

### Agent Skill (P1)

Triggered by `/idea4ai` or natural language; must run novelty + scorecard; summarize with link to Web report when available.

## 6. Phased roadmap

### P0 — Web + Engine core

Clarify, novelty guard, 8-dim scorecard, verdict, report, history, mock LLM mode.

### P1 — Embed + stronger signals

MCP package, Cursor/Claude Skill, API keys, deeper collision/search signals, optional rewrite suggestions.

### P2 — Experiments + canvas

RAT / Mom Test / fake door / concierge cards, Test Card subset, Lean Canvas/JTBD lite, optional light pitch / pressure test. No heavy TAM engine.

## 7. Capability mapping from `s.txt`

| Source capability | Idea4AI placement | Phase |
|---|---|---|
| 5-stage clarity (validate-idea) | `clarify` + Web prompts | P0 |
| Reject generic AI-powered X (novel-idea-hunter) | `novelty_guard` | P0 |
| Reality / collision score (idea-reality-mcp) | novelty + signals | P0→P1 |
| Multi-dim score + kill/pivot/test/build (Trigvale, TweakIdea) | 8-dim scorecard | P0 |
| Evidence-graded reports (AIdeator, Apify-style) | `evidence` + `reports` | P0 |
| Demand/competition signals (Ara, Fluenta, etc.) | report sections + retrieval | P0→P1 |
| MCP tool shape | `mcp/` | P1 |
| Skill workflows (Venture Analyst, etc.) | `skills/idea4ai` | P1 |
| RAT ≤2w ≤$100, Mom Test / fake door / concierge | `experiments` | P2 |
| Test Cards / persevere-pivot-kill library | vibe experiment subset | P2 |
| Lean Canvas / JTBD / SWOT lite | `canvas` | P2 |
| Three rewrites (TweakIdea) | rewrite suggestions | P1–P2 |
| PMF Kit style decide-from-evidence | decision section + later export | P2 |
| Pitch / heavy TAM (commercial tools) | optional 30s pitch only | P2 optional |
| Investor attack sim | optional pressure test | P2 optional |

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated “evidence” | Mandatory L0–L3; no ≥L2 without URL |
| Vague ideas scoring high | Novelty veto + rewrite gate |
| LLM cost | `quick_check` vs full run; async jobs; mock mode |
| API key leak (P1) | Hash storage, revoke, rate limits |
| Scope creep | Hard filter: vibe coding only |

## 9. Testing (P0 minimum)

- Unit: verdict thresholds, novelty templates, evidence grade rules  
- Contract: validate → run → report JSON schema  
- Golden ideas: one expected kill / test / build each  
- Web E2E smoke with `MOCK_LLM=1`

## 10. Repository layout (target)

```text
Idea4AI/
  apps/web/          # Next.js app (API + UI)
  packages/engine/   # validation modules (optional monorepo split; may start in-app)
  mcp/               # P1 MCP server
  skills/idea4ai/    # P1 agent skill
  docs/superpowers/  # specs & plans
```

P0 may keep engine inside `apps/web` and extract when MCP lands.

## 11. Open decisions (resolved in this brainstorm)

- Form: full-stack Web + Cursor/Claude embed (not Skill-only or CLI-only)  
- Domain: vibe coding only  
- Architecture: shared engine + multi-surface  
- Delivery: P0 → P1 → P2  
- Stack: Next.js + Supabase + Vercel + pluggable LLM  
