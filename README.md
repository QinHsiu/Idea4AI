# Idea4AI

Vibe coding 场景的 Idea 验证器：输入一句话产品想法，输出结构化澄清、受众、新颖性检查、8 维评分、`kill | pivot | test | build` 判决与可审计报告。

设计目标：**Web 为主**，同一套 Validation Engine 通过 REST / MCP / Agent Skill 接入 Cursor / Claude。

## 当前进度

| 能力 | 状态 |
|---|---|
| Zod schemas / evidence / Fluenta fold / verdict | ✅ P0 |
| Mock fixtures + 内存 Store + Web + REST | ✅ P0 |
| Supabase / 真实 LLM / MCP / Skill | ✅ P1 |
| monetization / pmf / rewrite / retrieval L2 / research+pitch | ✅ P1 |
| experiments（RAT/Mom/fake door/concierge）+ Test Card 字段 | ✅ P2 |
| canvas（Lean / JTBD / SWOT） | ✅ P2 |
| pestle lite | ✅ P2 |
| multi_agent / 纯 stats / TweakIdea 14 并行 | ⏸ defer |
| Idea 生成、命名、重 TAM、外部工具推荐、CLI 主形态、商业 UI 克隆 | ✕ non_goal |

## 快速开始

```bash
cd Idea4AI
npm install
cp .env.example .env   # 默认 MOCK_LLM=1
npm test
npm run dev            # http://localhost:3000
```

- http://localhost:3000/validate
- http://localhost:3000/ideas
- http://localhost:3000/api/health

### 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `MOCK_LLM` | `1` | fixture；`0` → LLM 或启发式 |
| `PIPELINE_VERSION` | `p2.0.0` | 写入报告 |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | — | 齐全则 Supabase |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | — | `MOCK_LLM=0` |
| `ENABLE_RETRIEVAL` | 关 | npm+HN L2 collision |
| `ENABLE_DEEP_RESEARCH` | 关 | LLM 增强 research |
| `IDEA4AI_API_BASE` | `http://localhost:3000` | MCP |

## MCP / Skill

```bash
npm run mcp:install && npm run mcp
```

Skill：`skills/idea4ai/SKILL.md`

## 仓库结构

```text
Idea4AI/
  src/app/ engine/ store/
  mcp/ skills/idea4ai/
  supabase/migrations/
```

## License

Private / TBD.
