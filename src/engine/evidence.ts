export const EVIDENCE_ID_RE = /^ev_[a-z0-9]{8}_\d{3}$/;

export function runShort(runId: string): string {
  const alnum = runId.toLowerCase().replace(/[^a-z0-9]/g, "");
  return alnum.slice(0, 8).padStart(8, "0");
}

export type EvidenceGrade = "L0" | "L1" | "L2" | "L3";

export class EvidenceAccumulator {
  private seq = 0;
  readonly items: {
    id: string;
    claim: string;
    grade: EvidenceGrade;
    url?: string;
  }[] = [];
  constructor(private runId: string) {}
  add(input: { claim: string; grade: EvidenceGrade; url?: string }): string {
    this.seq += 1;
    const id = `ev_${runShort(this.runId)}_${String(this.seq).padStart(3, "0")}`;
    this.items.push({ id, ...input });
    return id;
  }
}
