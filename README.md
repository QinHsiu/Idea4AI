# Idea4AI

Vibe coding 场景的 Idea 验证器：输入一句话产品想法，输出结构化澄清、受众、新颖性检查、8 维评分、`kill | pivot | test | build` 判决与可审计报告。

设计目标：**Web 为主**，同一套 Validation Engine 后续可接入 Cursor / Claude（MCP + Agent Skill）。**P0 已完成**（引擎 + Mock 流水线 + 内存 API + Web 校验/报告页）。

## P0 done checklist（§12.7）

- [x] Schemas + unit/contract tests green（含 `evidence_ids ⊆ evidence[]` report refine）
- [x] Web path：`/validate` → 创建并校验 → `/ideas/[id]` 查看报告
- [x] Three golden fixtures：`mock_kill` / `mock_test` / `mock_build` 判决类可测可读
- [x] README + `.env.example` 说明 `MOCK_LLM` 与环境变量
- [x] 无 MCP / Skill（P1）
- [x] Report JSON 预留 `monetization` / `pmf` / `experiments` / `canvas` / `pestle` / `pitch`（P0 为 `null`）；`supabase/migrations/20260918_p0_init.sql` 预留列约束

## 当前进度

| 能力 | 状态 |
|---|---|
| Zod schemas / evidence id / Cap 枚举 | ✅ |
| Fluenta 六信号折入 8 维 + 权重合成 | ✅ |
| 确定性 `verdict`（含 cap 降级） | ✅ |
| `MOCK_LLM` 三套固定 fixture（kill/test/build） | ✅ |
| Pipeline：`clarify → audience → novelty → scorecard → verdict → report` | ✅ |
| 内存 Store + REST API | ✅ |
| Web 校验/报告页 | ✅ |
| Supabase / 真实 LLM / MCP / Skill | ⏳ P1+ |

## 快速开始

```bash
cd Idea4AI
npm install
cp .env.example .env   # 默认 MOCK_LLM=1，见文件内注释
npm test               # 单元/契约/P0 golden
npm run dev            # http://localhost:3000
```

打开：

- http://localhost:3000/validate — 输入 Idea 并验证  
- http://localhost:3000/ideas — 历史列表  
- http://localhost:3000/ideas/&lt;id&gt; — 报告页  

### 环境变量

详见 `.env.example`：

| 变量 | 默认 | 说明 |
|---|---|---|
| `MOCK_LLM` | `1` | `1`：不调外部 LLM，用固定 fixture；`0`：启发式流水线（演示用） |
| `PIPELINE_VERSION` | `p0.1.0` | 写入报告的流水线版本 |
| `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` | — | P1 可选 |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | — | P1 真实 LLM 可选 |

## API（P0）

默认数据在进程内内存；重启后清空。推荐用原子接口：

```bash
# 一次完成：创建 + 校验 + 等待报告
curl -s -X POST http://localhost:3000/api/validate \
  -H "content-type: application/json" \
  -d "{\"text\":\"Cursor plugin that reviews PR diffs\",\"fixture\":\"test\"}"

# 分步（仍可用）
curl -s -X POST http://localhost:3000/api/ideas \
  -H "content-type: application/json" \
  -d "{\"text\":\"...\"}"
curl -s -X POST "http://localhost:3000/api/ideas/<idea_id>/validate?fixture=kill"
curl -s http://localhost:3000/api/ideas/<idea_id>/report
```

`fixture` 可选：`kill` | `test` | `build`。

## 仓库结构

```text
Idea4AI/
  src/
    app/                 # Next.js 页面 + Route Handlers
    engine/              # Validation Engine + fixtures
    store/               # P0 内存存储（globalThis 单例）
  supabase/migrations/   # P0 reports JSON 预留键约束
```

## 判决与评分（摘要）

- **8 维**：Pain, Urgency, Differentiation, Buildability, Distribution, Willingness, Competition, FounderFit  
- **判决**：`kill` / `pivot` / `test` / `build`，受 novelty veto、Diff/Dist&lt;30、`build_gate_fail` 等 cap 约束  
- **证据等级**：L0–L3；L2/L3 必须带 `https?://` URL；`demand_signals.*.evidence_ids` 必须 ⊆ `evidence[].id`

## 开发

```bash
npm test
npm run test:watch
npm run build
```

## License

Private / TBD.
