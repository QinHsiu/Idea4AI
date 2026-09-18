import { describe, it, expect } from "vitest";
import { runShort, EvidenceAccumulator, EVIDENCE_ID_RE } from "../evidence";

describe("runShort", () => {
  it("filters mock run_id underscores", () => {
    expect(runShort("mock_kill_a1b2c3d4e5f6")).toBe("mockkill");
  });
  it("pads short alnum", () => {
    expect(runShort("ab")).toBe("000000ab");
  });
});

describe("EvidenceAccumulator", () => {
  it("ids match locked regex", () => {
    const acc = new EvidenceAccumulator("mock_kill_a1b2c3d4e5f6");
    const id = acc.add({ claim: "c", grade: "L0" });
    expect(id).toBe("ev_mockkill_001");
    expect(id).toMatch(EVIDENCE_ID_RE);
  });
});
