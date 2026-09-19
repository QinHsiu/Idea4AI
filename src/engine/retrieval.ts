import type { ClarifiedIdea } from "./schemas";
import type { EvidenceGrade } from "./evidence";

export type CollisionHint = {
  source: string;
  title: string;
  url?: string;
  grade: EvidenceGrade;
};

/** Opt-in live retrieval (idea-reality / Preuve-style L2 links). */
export function isRetrievalEnabled(): boolean {
  return process.env.ENABLE_RETRIEVAL === "1";
}

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "to",
  "of",
  "in",
  "on",
  "with",
  "that",
  "this",
  "ai",
  "app",
  "tool",
  "platform",
  "solution",
  "powered",
]);

/** Build a short public-search query from idea text + clarified fields. */
export function retrievalQuery(ideaText: string, clarified: ClarifiedIdea): string {
  const raw = `${clarified.artifact} ${clarified.one_liner} ${ideaText}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ");
  const tokens = raw
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP.has(t));
  const uniq: string[] = [];
  for (const t of tokens) {
    if (!uniq.includes(t)) uniq.push(t);
    if (uniq.length >= 6) break;
  }
  return uniq.join(" ") || clarified.one_liner.slice(0, 60);
}

async function fetchJson(
  url: string,
  timeoutMs = 4000,
): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchNpmHints(query: string): Promise<CollisionHint[]> {
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=3`;
  const data = (await fetchJson(url)) as {
    objects?: { package?: { name?: string; description?: string; links?: { npm?: string } } }[];
  } | null;
  if (!data?.objects?.length) return [];
  return data.objects
    .map((obj) => {
      const pkg = obj.package;
      if (!pkg?.name) return null;
      const link =
        pkg.links?.npm ?? `https://www.npmjs.com/package/${encodeURIComponent(pkg.name)}`;
      return {
        source: "npm",
        title: pkg.description
          ? `${pkg.name} — ${pkg.description.slice(0, 80)}`
          : pkg.name,
        url: link.startsWith("http") ? link : `https://www.npmjs.com/package/${pkg.name}`,
        grade: "L2" as const,
      };
    })
    .filter((x): x is CollisionHint => x !== null);
}

export async function fetchHnHints(query: string): Promise<CollisionHint[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=3`;
  const data = (await fetchJson(url)) as {
    hits?: { objectID?: string; title?: string; url?: string | null }[];
  } | null;
  if (!data?.hits?.length) return [];
  return data.hits
    .map((hit) => {
      if (!hit.title || !hit.objectID) return null;
      const storyUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
      const external =
        typeof hit.url === "string" && hit.url.startsWith("http")
          ? hit.url
          : storyUrl;
      return {
        source: "hackernews",
        title: hit.title.slice(0, 120),
        url: external,
        grade: "L2" as const,
      };
    })
    .filter((x): x is CollisionHint => x !== null);
}

/** Fail-open multi-source collision scan; max 6 hints, deduped by URL. */
export async function fetchCollisionHints(
  ideaText: string,
  clarified: ClarifiedIdea,
): Promise<CollisionHint[]> {
  const q = retrievalQuery(ideaText, clarified);
  if (!q.trim()) return [];

  const [npm, hn] = await Promise.all([
    fetchNpmHints(q),
    fetchHnHints(q),
  ]);

  const seen = new Set<string>();
  const out: CollisionHint[] = [];
  for (const hint of [...npm, ...hn]) {
    const key = (hint.url ?? hint.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hint);
    if (out.length >= 6) break;
  }
  return out;
}
