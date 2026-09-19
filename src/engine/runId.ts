import { createHash } from "crypto";

/** Content-addressed run id so the same ideaId+text yields stable evidence ids. */
export function deterministicRunId(ideaId: string, ideaText: string): string {
  const hash = createHash("sha256")
    .update(`${ideaId}\n${ideaText.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 12);
  return `run_${hash}`;
}
