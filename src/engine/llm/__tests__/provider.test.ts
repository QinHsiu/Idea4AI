import { afterEach, describe, expect, it } from "vitest";
import { extractJsonObject, resolveLlmMode } from "../provider";

describe("resolveLlmMode", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults to mock when MOCK_LLM is not 0", () => {
    process.env.MOCK_LLM = "1";
    process.env.OPENAI_API_KEY = "sk-test";
    expect(resolveLlmMode()).toBe("mock");
  });

  it("uses openai when MOCK_LLM=0 and key present", () => {
    process.env.MOCK_LLM = "0";
    process.env.OPENAI_API_KEY = "sk-test";
    delete process.env.ANTHROPIC_API_KEY;
    expect(resolveLlmMode()).toBe("openai");
  });

  it("falls back to heuristic when MOCK_LLM=0 without keys", () => {
    process.env.MOCK_LLM = "0";
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(resolveLlmMode()).toBe("heuristic");
  });
});

describe("extractJsonObject", () => {
  it("parses fenced-ish LLM output", () => {
    const raw = 'Sure:\n{"who":"devs","pain":"x","artifact":"y","why_now":"z","one_liner":"a","assumptions":[],"low_specificity":false}\n';
    const obj = extractJsonObject(raw) as { who: string };
    expect(obj.who).toBe("devs");
  });
});
