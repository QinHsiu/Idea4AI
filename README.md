# Idea4AI

Vibe coding 场景的 Idea 验证器：输入一句话产品想法，输出结构化澄清、受众、新颖性检查、8 维评分、`kill | pivot | test | build` 判决与可审计报告。

设计目标：**Web 为主**，同一套 Validation Engine 后续可接入 Cursor / Claude（MCP + Agent Skill）。当前仓库处于 **P0**（引擎 + Mock 流水线 + 内存 API）。

## 当前进度（P0）

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
cp .env.example .env   # 默认 MOCK_LLM=1
npm test               # 单元/契约测试
npm run dev            # http://localhost:3000
```

环境变量（见 `.env.example`）：

| 变量 | 说明 |
|---|---|
| `MOCK_LLM` | 默认 `1`：不调用外部 LLM，返回固定 fixture。设为 `0` 时走启发式流水线（P0 演示用，非生产） |
| `PIPELINE_VERSION` | 报告内版本号，默认 `p0.1.0` |

可选（P1 再启用）：`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`

## API（P0）

默认数据在进程内内存；重启后清空。

```bash
# 创建 Idea
curl -s -X POST http://localhost:3000/api/ideas \
  -H "content-type: application/json" \
  -d "{\"text\":\"Cursor plugin that reviews PR diffs for vibe apps\"}"

# 跑验证（可选 fixture=kill|test|build 或 Header: X-Mock-Fixture）
curl -s -X POST "http://localhost:3000/api/ideas/<idea_id>/validate?fixture=test"

# 查询 run / 报告
curl -s http://localhost:3000/api/runs/<run_id>
curl -s http://localhost:3000/api/ideas/<idea_id>/report
```

## 仓库结构

```text
Idea4AI/
  src/
    app/                 # Next.js App Router（页面 + Route Handlers）
    engine/              # Validation Engine（schemas / fold / verdict / pipeline / fixtures）
    store/               # P0 内存存储
  supabase/              #（计划）迁移脚本
```

## 判决与评分（摘要）

- **8 维**：Pain, Urgency, Differentiation, Buildability, Distribution, Willingness, Competition, FounderFit  
- **判决**：`kill` / `pivot` / `test` / `build`，受 novelty veto、Diff/Dist&lt;30、`build_gate_fail` 等 cap 约束  
- **证据等级**：L0–L3；L2/L3 必须带 `https?://` URL（Zod 强制）

## 开发

```bash
npm test          # vitest 一次跑完
npm run test:watch
npm run build     # Next 生产构建
```

分支约定：功能开发使用 feature 分支，合并进 `master` 后推送。

## License

Private / TBD.
