import { describe, it, expect } from "vitest";
import { verifyPassEligibility, resolveCnfFromInput, isCnfEligible } from "@/lib/pass-eligibility";
import eligibleCnfsData from "@/data/eligible-pass-cnfs.json";

describe("Premium Pass Eligibility — Non-PII Verification", () => {
  // 1. Data Integrity Checks
  it("loads the sanitized list of eligible Premium Pass CNFs", () => {
    expect(Array.isArray(eligibleCnfsData)).toBe(true);
    expect(eligibleCnfsData.length).toBeGreaterThan(100);
    // Ensure all entries are anonymous CNF strings with no PII
    for (const entry of eligibleCnfsData) {
      expect(typeof entry).toBe("string");
      expect(entry.startsWith("CNF")).toBe(true);
      expect(entry).not.toContain("@");
    }
  });

  // 2. Eligible Premium Pass Participants
  it("ALLOWS registration for valid Premium Pass CNFs", () => {
    const validSample = ["CNF-7EEEB1", "CNF-0C2894", "CNF-AC9BAB"];
    for (const cnf of validSample) {
      expect(isCnfEligible(cnf)).toBe(true);
      const result = verifyPassEligibility({ cnfNumber: cnf });
      expect(result.allowed).toBe(true);
      expect(result.passCategory).toBe("Premium Pass");
      expect(result.cnf).toBe(cnf);
    }
  });

  it("handles case-insensitivity and whitespace in CNF inputs", () => {
    const result = verifyPassEligibility({ cnfNumber: "  cnf-7eeeb1  " });
    expect(result.allowed).toBe(true);
    expect(result.cnf).toBe("CNF-7EEEB1");
    expect(result.passCategory).toBe("Premium Pass");
  });

  // 3. Rejected Ineligible / Entertainment Pass Participants
  it("STRICTLY REJECTS non-eligible or Entertainment Pass CNFs", () => {
    const ineligibleCnfs = [
      "CNF-DD63FF",
      "CNF-02A631",
      "CNF-4C7331",
      "CNF-46552F",
      "CNF-0DE916",
      "CNF-NON-EXISTENT",
    ];

    for (const cnf of ineligibleCnfs) {
      expect(isCnfEligible(cnf)).toBe(false);
      const res = verifyPassEligibility({ cnfNumber: cnf });
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("not eligible");
    }
  });

  // 4. Input resolution
  it("correctly resolves CNF from various input forms", () => {
    expect(resolveCnfFromInput({ cnfNumber: "CNF-123456" })).toBe("CNF-123456");
    expect(resolveCnfFromInput({ teamCode: "CNF-123456" })).toBe("CNF-123456");
    expect(resolveCnfFromInput({ teamCode: "CNF000" })).toBe("CNF000");
    expect(resolveCnfFromInput({ teamCode: "RANDOM-TEAM" })).toBeNull();
    expect(resolveCnfFromInput({})).toBeNull();
  });
});
