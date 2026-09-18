import Link from "next/link";

export default function HomePage() {
  return (
    <main className="stack">
      <section className="card">
        <h1>Idea4AI</h1>
        <p className="lead">
          面向 vibe coding 的 Idea 验证：澄清、受众、新颖性、8 维评分，给出 kill /
          pivot / test / build。
        </p>
        <p>
          <Link className="button" href="/validate">
            开始验证
          </Link>
        </p>
      </section>
    </main>
  );
}
