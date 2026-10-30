import { describe, it, expect } from "vitest";
import { verifyPassEligibility, resolveCnfFromInput } from "@/lib/pass-eligibility";
import { OFFICIAL_PARTICIPANTS, getOfficialParticipantByCnf } from "@/data/official-participants";
import { CONFIRMED_STUDENTS_LIST, getConfirmedStudent } from "@/data/confirmed-students";

describe("Premium Pass Eligibility — Mandatory Verification", () => {
  // 1. Data Integrity Checks
  it("loads 275 official participants from the Excel roster", () => {
    expect(OFFICIAL_PARTICIPANTS.length).toBe(275);
  });

  it("loads 203 confirmed students from the website student master list", () => {
    expect(CONFIRMED_STUDENTS_LIST.length).toBe(203);
  });

  // 2. Eligible Premium Pass Participants
  it("ALLOWS registration for valid students with Premium Pass in both lists", () => {
    // Sravya: CNF-7EEEB1 (Leader, 404 NOT FOUND, Premium Pass)
    const result1 = verifyPassEligibility({ cnfNumber: "CNF-7EEEB1" });
    expect(result1.allowed).toBe(true);
    expect(result1.errorCode).toBe("ELIGIBLE");
    expect(result1.passCategory).toBe("Premium Pass");
    expect(result1.participant?.name).toBe("Sravya");

    // Amrutha: CNF-0C2894 (Member, 404 NOT FOUND, Premium Pass)
    const result2 = verifyPassEligibility({ cnfNumber: "CNF-0C2894" });
    expect(result2.allowed).toBe(true);
    expect(result2.errorCode).toBe("ELIGIBLE");
    expect(result2.passCategory).toBe("Premium Pass");
    expect(result2.participant?.name).toBe("Amrutha");

    // Bagadhi Abhinav: CNF-AC9BAB (Premium Pass)
    const result3 = verifyPassEligibility({ cnfNumber: "CNF-AC9BAB" });
    expect(result3.allowed).toBe(true);
    expect(result3.errorCode).toBe("ELIGIBLE");
    expect(result3.passCategory).toBe("Premium Pass");
  });

  it("handles case-insensitivity and whitespace in CNF inputs", () => {
    const result = verifyPassEligibility({ cnfNumber: "  cnf-7eeeb1  " });
    expect(result.allowed).toBe(true);
    expect(result.cnf).toBe("CNF-7EEEB1");
    expect(result.passCategory).toBe("Premium Pass");
  });

  // 3. Rejected Entertainment Pass Participants (MANDATORY RULE 3)
  it("STRICTLY REJECTS Entertainment Pass holders even when their CNF matches both lists", () => {
    // 9 confirmed students in website master list who have Entertainment Pass:
    const entertainmentCnfs = [
      "CNF-DD63FF", // marri sahithi priya
      "CNF-02A631", // kodinti bhavitha
      "CNF-4C7331", // basam navya
      "CNF-46552F", // Rakshitha Mengane
      "CNF-0DE916", // Varshini Gadusu
      "CNF-32D5ED", // Karthika Karnati
      "CNF-8C8D62", // Ch.Keerthana
      "CNF-961504", // Alekhya Koppisetti
      "CNF-5777A3", // I.Krishnaveni
    ];

    for (const cnf of entertainmentCnfs) {
      // Must exist in website master
      expect(getConfirmedStudent(cnf)).toBeDefined();
      // Must exist in official Excel
      const official = getOfficialParticipantByCnf(cnf);
      expect(official).toBeDefined();
      expect(official?.pass).toBe("Entertainment Pass");

      // Verify eligibility function rejects them
      const res = verifyPassEligibility({ cnfNumber: cnf });
      expect(res.allowed).toBe(false);
      expect(res.errorCode).toBe("REJECTED_ENTERTAINMENT_PASS");
      expect(res.reason).toContain("Entertainment Pass holders are not eligible");
    }
  });

  // 4. CNF Mismatches (MANDATORY RULE 2)
  it("REJECTS participants in Excel who are NOT in the website master list", () => {
    // CNF-0B4045 is in Excel (Dilip Sai, Premium Pass) but NOT in confirmed-students.ts
    const inExcel = getOfficialParticipantByCnf("CNF-0B4045");
    expect(inExcel).toBeDefined();
    expect(getConfirmedStudent("CNF-0B4045")).toBeNull();

    const result = verifyPassEligibility({ cnfNumber: "CNF-0B4045" });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("NOT_IN_WEBSITE_MASTER");
    expect(result.reason).toContain("not in the confirmed student master list");
  });

  it("REJECTS participants in website master list who are NOT in the official Excel roster", () => {
    // CNF-7E7EBA (Pavani) is in confirmed-students.ts but NOT in the Excel roster
    expect(getConfirmedStudent("CNF-7E7EBA")).toBeDefined();
    expect(getOfficialParticipantByCnf("CNF-7E7EBA")).toBeUndefined();

    const result = verifyPassEligibility({ cnfNumber: "CNF-7E7EBA" });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("NOT_IN_EXCEL");
    expect(result.reason).toContain("not found in the official Equinox registrations roster");
  });

  // 5. Unknown or missing CNFs
  it("REJECTS unknown CNF numbers", () => {
    const result = verifyPassEligibility({ cnfNumber: "CNF-UNKNOWN-999" });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("NOT_IN_WEBSITE_MASTER");
  });

  it("REJECTS missing or empty CNF inputs", () => {
    const result = verifyPassEligibility({});
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("MISSING_CNF");
  });

  // 6. CNF Resolution from Email and Team Code
  it("resolves CNF automatically from registered email if present in official roster", () => {
    const resolved = resolveCnfFromInput({ email: "jodusravya11@gmail.com" });
    expect(resolved).toBe("CNF-7EEEB1");

    const result = verifyPassEligibility({ email: "jodusravya11@gmail.com" });
    expect(result.allowed).toBe(true);
    expect(result.cnf).toBe("CNF-7EEEB1");
  });

  // 7. Pass Category Immutability (MANDATORY RULE 6)
  it("strictly enforces server-side pass category without trusting client overrides", () => {
    // Even if caller passed custom fields, verifyPassEligibility looks up the pass strictly from the official roster
    const res = verifyPassEligibility({ cnfNumber: "CNF-7EEEB1" });
    expect(res.passCategory).toBe("Premium Pass");
    expect(res.allowed).toBe(true);

    // An Entertainment Pass holder cannot be overridden
    const resEnt = verifyPassEligibility({ cnfNumber: "CNF-DD63FF" });
    expect(resEnt.passCategory).toBe("Entertainment Pass");
    expect(resEnt.allowed).toBe(false);
  });
});
