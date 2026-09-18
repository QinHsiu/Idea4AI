"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Fixture = "" | "kill" | "test" | "build";

export default function ValidatePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [fixture, setFixture] = useState<Fixture>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          ...(fixture ? { fixture } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Validate failed");
      }
      router.push(`/ideas/${data.idea_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <main className="stack">
      <section className="card">
        <h1>验证 Idea</h1>
        <p className="lead">输入 vibe coding 产品想法，跑完整校验流水线。</p>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Idea
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="例如：给独立开发者的 Cursor 插件，一键生成落地页并接 Stripe"
              required
            />
          </label>
          <label>
            Mock fixture（可选，本地 MOCK_LLM）
            <select
              value={fixture}
              onChange={(e) => setFixture(e.target.value as Fixture)}
            >
              <option value="">自动选择</option>
              <option value="kill">kill</option>
              <option value="test">test</option>
              <option value="build">build</option>
            </select>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={loading || !text.trim()}>
            {loading ? "验证中…" : "开始验证"}
          </button>
        </form>
      </section>
    </main>
  );
}
