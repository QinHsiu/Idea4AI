import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCollisionHints,
  fetchHnHints,
  fetchNpmHints,
  isRetrievalEnabled,
  retrievalQuery,
} from "../retrieval";
import type { ClarifiedIdea } from "../schemas";

const clarified: ClarifiedIdea = {
  who: "developers",
  pain: "slow PR reviews",
  artifact: "cursor plugin",
  why_now: "now",
  one_liner: "Cursor plugin that reviews PR diffs",
  assumptions: [],
  low_specificity: false,
};

describe("retrievalQuery", () => {
  it("keeps distinctive tokens", () => {
    const q = retrievalQuery("Cursor plugin that reviews PR diffs", clarified);
    expect(q).toMatch(/cursor|plugin|review|diff/i);
    expect(q.split(/\s+/).length).toBeLessThanOrEqual(6);
  });
});

describe("isRetrievalEnabled", () => {
  afterEach(() => {
    delete process.env.ENABLE_RETRIEVAL;
  });

  it("is opt-in via ENABLE_RETRIEVAL=1", () => {
    delete process.env.ENABLE_RETRIEVAL;
    expect(isRetrievalEnabled()).toBe(false);
    process.env.ENABLE_RETRIEVAL = "1";
    expect(isRetrievalEnabled()).toBe(true);
  });
});

describe("fetchCollisionHints", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps npm + HN JSON into L2 hints with urls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("registry.npmjs.org")) {
          return {
            ok: true,
            json: async () => ({
              objects: [
                {
                  package: {
                    name: "pr-review-bot",
                    description: "Reviews PR diffs",
                    links: { npm: "https://www.npmjs.com/package/pr-review-bot" },
                  },
                },
              ],
            }),
          };
        }
        if (url.includes("hn.algolia.com")) {
          return {
            ok: true,
            json: async () => ({
              hits: [
                {
                  objectID: "123",
                  title: "Show HN: PR review helper",
                  url: "https://example.com/pr-review",
                },
              ],
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      }),
    );

    const hints = await fetchCollisionHints(
      "Cursor plugin that reviews PR diffs",
      clarified,
    );
    expect(hints.length).toBeGreaterThanOrEqual(2);
    expect(hints.every((h) => h.grade === "L2" && h.url?.startsWith("http"))).toBe(
      true,
    );
    expect(hints.some((h) => h.source === "npm")).toBe(true);
    expect(hints.some((h) => h.source === "hackernews")).toBe(true);
  });

  it("fail-opens on network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    await expect(fetchNpmHints("x")).resolves.toEqual([]);
    await expect(fetchHnHints("x")).resolves.toEqual([]);
    await expect(
      fetchCollisionHints("x", clarified),
    ).resolves.toEqual([]);
  });
});
