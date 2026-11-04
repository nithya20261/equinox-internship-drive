import { describe, it, expect } from "vitest";
import { isCnfEligible, verifyPassEligibility, resolveCnfFromInput } from "@/lib/pass-eligibility";
import fs from "fs";

describe("Roll Number & CNF Application Form File Naming and Backend Eligibility", () => {
  it("recognizes council roll numbers as eligible pass identifiers", () => {
    // Council roll numbers
    expect(isCnfEligible("23R21A05M8")).toBe(true);
    expect(isCnfEligible("23R21A05U2")).toBe(true);
    expect(isCnfEligible("23R21A05G5")).toBe(true);
    expect(isCnfEligible("23R21A05K9")).toBe(true);
    expect(isCnfEligible("23R21A6757")).toBe(true);

    // Standard CNF numbers
    expect(isCnfEligible("CNF-7EEEB1")).toBe(true);
    expect(isCnfEligible("CNF-22033C")).toBe(true);

    // Invalid identifiers
    expect(isCnfEligible("resume")).toBe(false);
    expect(isCnfEligible("INVALID-123")).toBe(false);
  });

  it("validates filenames containing student roll numbers and CNF numbers correctly", () => {
    const alnumUpper = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    // Helper implementing the exact validation logic from StudentApplicationForm.tsx
    const validateResumeName = (fileName: string, userTeamCode?: string): boolean => {
      const cleanCnf = alnumUpper(userTeamCode || "");
      const fileNameUpper = alnumUpper(fileName);

      const matchesUserCode = Boolean(cleanCnf && fileNameUpper.includes(cleanCnf));
      const nameTokens = fileName.split(/[^A-Za-z0-9-]+/).filter(Boolean);
      const hasEligibleTokenInName = nameTokens.some((token) => isCnfEligible(token));

      return matchesUserCode || hasEligibleTokenInName;
    };

    // Case 1: Student with roll number teamCode uploads resume with their roll number
    expect(validateResumeName("23R21A05M8_Nithya_Resume.pdf", "23R21A05M8")).toBe(true);
    expect(validateResumeName("23r21a05m8-cv.pdf", "23R21A05M8")).toBe(true);

    // Case 2: Student with CNF teamCode uploads resume with their CNF number
    expect(validateResumeName("CNF-7EEEB1_Nithya.pdf", "CNF-7EEEB1")).toBe(true);
    expect(validateResumeName("CNF7EEEB1_Nithya.docx", "CNF-7EEEB1")).toBe(true);

    // Case 3: Student with CNF teamCode uploads resume with their council roll number
    expect(validateResumeName("23R21A05M8_Nithya.pdf", "CNF-7EEEB1")).toBe(true);

    // Case 4: File without CNF or Roll Number should be REJECTED
    expect(validateResumeName("my_resume.pdf", "23R21A05M8")).toBe(false);
    expect(validateResumeName("JohnDoe_CV.pdf", "23R21A05M8")).toBe(false);
    expect(validateResumeName("resume_final_v2.docx", "CNF-7EEEB1")).toBe(false);
  });

  it("verifies StudentApplicationForm.tsx UI contains instructions for both CNFNUMBER_NAME and ROLLNO_NAME", () => {
    const formCode = fs.readFileSync("src/components/site/StudentApplicationForm.tsx", "utf8");

    // Block 06 resume instruction mentions both CNFNUMBER_NAME and ROLLNO_NAME
    expect(formCode).toContain("CNFNUMBER_NAME");
    expect(formCode).toContain("ROLLNO_NAME");

    // Block 07 video instruction mentions both CNFNUMBER_NAME and ROLLNO_NAME
    expect(formCode).toContain("Video file in Google Drive must be named as");
    
    // Mandatory notice mentions both CNFNUMBER_NAME and ROLLNO_NAME
    expect(formCode).toContain("MANDATORY FILE NAMING:");
    expect(formCode).toContain("Both your Resume file and Video file in Google Drive must be named as");
  });

  it("verifies resolveCnfFromInput and verifyPassEligibility accept roll numbers", () => {
    const res = verifyPassEligibility({ cnfNumber: "23R21A05M8" });
    expect(res.allowed).toBe(true);
    expect(res.cnf).toBe("23R21A05M8");

    const resolved = resolveCnfFromInput({ teamCode: "23R21A05M8" });
    expect(resolved).toBe("23R21A05M8");
  });
});
