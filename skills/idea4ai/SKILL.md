---
name: idea4ai
description: >
  Validate vibe-coding product ideas with Idea4AI — clarify audience/pain,
  score 8 dimensions, emit kill|pivot|test|build verdict and an auditable report.
  Use when the user mentions Idea4AI, /idea4ai, idea validation, kill/pivot/test/build,
  or wants a structured check before building a vibe-coded product.
---

# Idea4AI — Idea Validation Skill

## When to use

- User pastes a one-liner product idea and wants a go / no-go style verdict
- User asks to validate, stress-test, or score a vibe-coding idea
- User invokes `/idea4ai`

## Prerequisites

1. Idea4AI Next app running (`npm run dev` in the Idea4AI repo) — default `http://localhost:3000`
2. Optional: Idea4AI MCP server configured (tools: `validate_idea`, `get_report`, `quick_check`, `list_ideas`)
3. Without MCP, call the HTTP API directly with `fetch` / `curl`

## Workflow

1. **Capture the idea** — one sentence; ask for audience or pain only if the text is empty or under ~4 words.
2. **Quick check** — MCP `quick_check` or `GET /api/health` to confirm the API is up.
3. **Validate** — MCP `validate_idea` with `{ "text": "..." }`  
   or `POST /api/validate` with JSON `{ "text": "..." }`.  
   Prefer the atomic `/api/validate` over create + validate separately.
4. **Present results** (keep it short):
   - Verdict: `kill` | `pivot` | `test` | `build`
   - Composite score
   - Caps applied (if any)
   - Clarified one-liner + primary audience
   - Exactly the 3 `next_actions` from the report
5. **Offer deepen** — link or fetch full report via `get_report` / `GET /api/ideas/{id}/report` if the user wants evidence or scorecard detail.

## Rules

- Do **not** invent scores or verdicts — only quote the API/MCP response.
- Present monetization, pmf, research, experiments, canvas, pestle when present in the report.
- Domain is **vibe coding ideas**; refuse unrelated domains politely and suggest rephrasing into a product idea.
- If `MOCK_LLM=1`, mention that results came from fixtures / mock mode when the user asks about rigor.
- Never paste Supabase service-role keys or LLM API keys into chat or commits.

## Example

User: `/idea4ai Cursor plugin that auto-reviews PR diffs for junior engineers`

Agent:
1. `quick_check`
2. `validate_idea` with that text
3. Reply with verdict, composite, caps, one-liner, three next actions, and `idea_id`
