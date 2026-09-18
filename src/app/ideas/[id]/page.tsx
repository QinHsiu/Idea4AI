"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ValidationReport } from "@/engine/schemas";

type IdeaPayload = {
  idea: { id: string; text: string; created_at: string };
  run: {
    run_id: string;
    status: string;
    error: string | null;
    verdict: string | null;
    composite: number | null;
  } | null;
  report: ValidationReport | null;
};

export default function IdeaReportPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<IdeaPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetch(`/api/ideas/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "load failed");
        if (cancelled) return;
        setData(json);
        if (json.run?.status === "running") {
          timer = setTimeout(load, 300);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  if (error) {
    return (
      <main className="card">
        <p className="error">{error}</p>
        <Link href="/ideas">返回列表</Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="card">
        <p className="muted">加载中…</p>
      </main>
    );
  }

  const { idea, run, report } = data;

  if (run?.status === "running" || (!report && run?.status !== "failed")) {
    return (
      <main className="card stack">
        <h1>验证进行中</h1>
        <p className="muted">Idea：{idea.text}</p>
        <p>状态：{run?.status ?? "pending"}…</p>
      </main>
    );
  }

  if (run?.status === "failed") {
    return (
      <main className="card stack">
        <h1>验证失败</h1>
        <p className="error">{run.error ?? "unknown error"}</p>
        <Link href="/validate">重试</Link>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="card stack">
        <h1>尚无报告</h1>
        <p className="muted">{idea.text}</p>
        <Link href="/validate">去验证</Link>
      </main>
    );
  }

  const verdict = report.verdict.verdict;
  const dims = report.scorecard.dimensions;

  return (
    <main className="stack">
      <section className="card stack">
        <div>
          <span className={`badge badge-${verdict}`}>{verdict}</span>
          <span className="muted" style={{ marginLeft: 10 }}>
            综合 {report.scorecard.composite}
          </span>
        </div>
        <h1>{report.clarified.one_liner}</h1>
        <p className="muted">原始输入：{idea.text}</p>
        <ul className="next-actions">
          {report.verdict.rationale.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {report.verdict.caps_applied.length > 0 ? (
          <p className="muted">
            caps：{report.verdict.caps_applied.join(", ")}
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2 className="section-title">8 维评分</h2>
        <div className="dims">
          {Object.entries(dims).map(([name, score]) => (
            <div className="dim-row" key={name}>
              <span>{name}</span>
              <div className="dim-bar">
                <span style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
              </div>
              <strong>{score}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">澄清后的陈述</h2>
        <div className="kv">
          <div>
            <span className="k">谁</span>
            <span>{report.clarified.who}</span>
          </div>
          <div>
            <span className="k">痛点</span>
            <span>{report.clarified.pain}</span>
          </div>
          <div>
            <span className="k">产物</span>
            <span>{report.clarified.artifact}</span>
          </div>
          <div>
            <span className="k">为何现在</span>
            <span>{report.clarified.why_now}</span>
          </div>
          <div>
            <span className="k">假设</span>
            <span>{report.clarified.assumptions.join("；")}</span>
          </div>
          <div>
            <span className="k">低具体度</span>
            <span>{report.clarified.low_specificity ? "是" : "否"}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">受众</h2>
        <div className="kv">
          <div>
            <span className="k">主画像</span>
            <span>
              {report.audience.primary.persona} ·{" "}
              {report.audience.primary.reachability} ·{" "}
              {report.audience.primary.notes}
            </span>
          </div>
          <div>
            <span className="k">非受众</span>
            <span>{report.audience.non_audience.join("；") || "—"}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">新颖性</h2>
        <div className="kv">
          <div>
            <span className="k">否决</span>
            <span>{report.novelty.veto ? "是" : "否"}</span>
          </div>
          <div>
            <span className="k">模板命中</span>
            <span>{report.novelty.template_hit ? "是" : "否"}</span>
          </div>
          <div>
            <span className="k">需改写</span>
            <span>{report.novelty.require_rewrite ? "是" : "否"}</span>
          </div>
        </div>
        {report.novelty.collision_hints.length > 0 ? (
          <ul className="evidence" style={{ marginTop: 12 }}>
            {report.novelty.collision_hints.map((h, i) => (
              <li key={`${h.title}-${i}`}>
                [{h.grade}] {h.source}: {h.title}
                {h.url ? (
                  <>
                    {" "}
                    <a href={h.url} target="_blank" rel="noreferrer">
                      link
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">无撞车提示</p>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">证据</h2>
        <ul className="evidence">
          {report.evidence.map((ev) => (
            <li key={ev.id}>
              <strong>{ev.id}</strong> [{ev.grade}] {ev.claim}
              {ev.url ? (
                <>
                  {" "}
                  <a href={ev.url} target="_blank" rel="noreferrer">
                    {ev.url}
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="section-title">下一步</h2>
        <ol className="next-actions">
          {report.next_actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
        <p className="muted" style={{ marginTop: 12 }}>
          pipeline {report.pipeline_version} · run {report.run_id}
        </p>
        <p>
          <Link href="/validate">再验一条</Link>
          {" · "}
          <Link href="/ideas">返回列表</Link>
        </p>
      </section>
    </main>
  );
}
