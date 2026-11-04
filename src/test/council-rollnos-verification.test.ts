import { describe, it, expect } from "vitest";
import { COUNCIL_MEMBERS, getCouncilMemberByRollNo } from "@/data/council-members";
import { isCnfEligible, verifyPassEligibility } from "@/lib/pass-eligibility";
import { registerStudentCore, loginStudentCore } from "@/lib/server-auth";
import eligibleCnfsData from "@/data/eligible-pass-cnfs.json";

describe("Council Department Roll Numbers as CNF — Comprehensive Verification", () => {
  it("contains all 104 council department members with unique roll numbers", () => {
    expect(COUNCIL_MEMBERS).toHaveLength(104);
    const uniqueRolls = new Set(COUNCIL_MEMBERS.map((m) => m.rollNo.toUpperCase()));
    expect(uniqueRolls.size).toBe(104);
  });

  it("ensures every council roll number exists in eligible-pass-cnfs.json", () => {
    const eligibleSet = new Set((eligibleCnfsData as string[]).map((c) => c.toUpperCase()));
    for (const member of COUNCIL_MEMBERS) {
      expect(eligibleSet.has(member.rollNo.toUpperCase())).toBe(true);
      expect(isCnfEligible(member.rollNo)).toBe(true);
    }
  });

  it("verifies pass eligibility for every council roll number across all departments", () => {
    // Technical (25)
    const techSample = getCouncilMemberByRollNo("23R21A05M8");
    expect(techSample?.name).toBe("K. GHANASHYAM");
    expect(techSample?.department).toBe("Technical");
    expect(verifyPassEligibility({ cnfNumber: "23R21A05M8" }).allowed).toBe(true);

    // Operations & Finance (14)
    const opsSample = getCouncilMemberByRollNo("23R21A05U2");
    expect(opsSample?.name).toBe("D.SATYA DURGA VINAY");
    expect(opsSample?.department).toBe("Operations & Finance");
    expect(verifyPassEligibility({ cnfNumber: "23R21A05U2" }).allowed).toBe(true);

    // Graphic Design (17)
    const designSample = getCouncilMemberByRollNo("23R21A05G5");
    expect(designSample?.name).toBe("SRITHEJITHA");
    expect(designSample?.department).toBe("Graphic Design");
    expect(verifyPassEligibility({ cnfNumber: "23R21A05G5" }).allowed).toBe(true);

    // Promotions & Sponsorship (10)
    const promoSample = getCouncilMemberByRollNo("23R21A05K9");
    expect(promoSample?.name).toBe("BANDARU MAHITH");
    expect(promoSample?.department).toBe("Promotions & Sponsorship");
    expect(verifyPassEligibility({ cnfNumber: "23R21A05K9" }).allowed).toBe(true);

    // Photography & Media (15)
    const photoSample = getCouncilMemberByRollNo("23R21A05BN");
    expect(photoSample?.name).toBe("PRIYANSHU ROY");
    expect(photoSample?.department).toBe("Photography & Media");
    expect(verifyPassEligibility({ cnfNumber: "23R21A05BN" }).allowed).toBe(true);

    // Content (11)
    const contentSample = getCouncilMemberByRollNo("23R21A6757");
    expect(contentSample?.name).toBe("T.JAYADEEP");
    expect(contentSample?.department).toBe("Content");
    expect(verifyPassEligibility({ cnfNumber: "23R21A6757" }).allowed).toBe(true);

    // Creatives (12)
    const creativeSample = getCouncilMemberByRollNo("23R21A0562");
    expect(creativeSample?.name).toBe("V SAI KRISHNA");
    expect(creativeSample?.department).toBe("Creatives");
    expect(verifyPassEligibility({ cnfNumber: "23R21A0562" }).allowed).toBe(true);
  });

  it("successfully registers a student using a council roll number as CNF", async () => {
    const regResult = await registerStudentCore({
      fullName: "K. GHANASHYAM",
      cnfNumber: "23R21A05M8",
      college: "MLR Institute of Technology",
      mobile: "9876543210",
      email: "ghanashyam.council@gmail.com",
      password: "CouncilPassword123",
    });

    expect(regResult.success).toBe(true);
    expect(regResult.error).toBeNull();
    expect(regResult.user).not.toBeNull();
    expect(regResult.user?.id).toBeDefined();
  });

  it("allows login using the registered council roll number and password", async () => {
    const loginResult = await loginStudentCore({
      cnfNumber: "23R21A05M8",
      password: "CouncilPassword123",
    });

    expect(loginResult).toBeDefined();
    expect(loginResult.user.email).toBe("ghanashyam.council@gmail.com");
    expect(loginResult.user.user_metadata?.role).toBe("student");
    expect(loginResult.session).toBeDefined();
  });

  it("allows login using case-insensitive roll number", async () => {
    const loginResult = await loginStudentCore({
      cnfNumber: "23r21a05m8",
      password: "CouncilPassword123",
    });

    expect(loginResult).toBeDefined();
    expect(loginResult.user.email).toBe("ghanashyam.council@gmail.com");
  });

  it("allows login using registered student email", async () => {
    const loginResult = await loginStudentCore({
      email: "ghanashyam.council@gmail.com",
      password: "CouncilPassword123",
    });

    expect(loginResult).toBeDefined();
    expect(loginResult.user.email).toBe("ghanashyam.council@gmail.com");
  });

  it("rejects unregistered or unauthorized roll numbers from registration", async () => {
    const fakeReg = await registerStudentCore({
      fullName: "Fake Student",
      cnfNumber: "99R99A9999",
      college: "MLRIT",
      mobile: "9876543210",
      email: "fake@gmail.com",
      password: "Password123",
    });

    expect(fakeReg.success).toBe(false);
    expect(fakeReg.error).toContain("not eligible");
  });

  it("rejects login for an authorized roll number that has NOT registered yet", async () => {
    // 25A21A0589 is an authorized roll number from council list (SAI RUTHWIK), but has not registered yet
    await expect(
      loginStudentCore({
        cnfNumber: "25A21A0589",
        password: "anypassword",
      })
    ).rejects.toThrow("This Confirmation Number (CNF) has not completed candidate registration yet");
  });
});
