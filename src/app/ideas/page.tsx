"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type IdeaRow = {
  id: string;
  text: string;
  created_at: string;
  status: string;
  verdict: string | null;
  composite: number | null;
};

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ideas")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "load failed");
        setIdeas(data.ideas ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <main className="stack">
      <section className="card">
        <h1>历史 Idea</h1>
        <p className="lead">进程内内存存储，重启后清空。</p>
        {error ? <p className="error">{error}</p> : null}
        {ideas.length === 0 && !error ? (
          <p className="muted">
            暂无记录。去 <Link href="/validate">验证</Link> 一条。
          </p>
        ) : (
          <ul className="idea-list">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <Link href={`/ideas/${idea.id}`}>
                  <strong>{idea.text.slice(0, 120)}</strong>
                  {idea.text.length > 120 ? "…" : ""}
                </Link>
                <div className="meta">
                  <span className={`badge badge-${idea.status}`}>{idea.status}</span>
                  {idea.verdict ? (
                    <span className={`badge badge-${idea.verdict}`}>
                      {idea.verdict}
                    </span>
                  ) : null}
                  {idea.composite != null ? <span>综合 {idea.composite}</span> : null}
                  <span>{new Date(idea.created_at).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
