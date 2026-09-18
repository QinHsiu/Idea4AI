import { createHash } from "crypto";

export type FixtureName = "kill" | "test" | "build";

export function pickFixture(ideaText: string, override?: FixtureName): FixtureName {
  if (override) return override;
  const hash = createHash("sha256")
    .update(ideaText.trim().toLowerCase())
    .digest("hex");
  const index = parseInt(hash.slice(0, 8), 16) % 3;
  return (["kill", "test", "build"] as const)[index];
}

export function mockRunId(fixture: FixtureName, ideaText: string): string {
  const hash = createHash("sha256")
    .update(ideaText.trim().toLowerCase())
    .digest("hex")
    .slice(0, 12);
  return `mock_${fixture}_${hash}`;
}
