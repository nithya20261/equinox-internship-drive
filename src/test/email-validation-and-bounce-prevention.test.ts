import { describe, it, expect } from "vitest";
import { validateEmailAddress } from "@/lib/email-validator";
import {
  registerStudentCore,
  requestPasswordResetCore,
  resendVerificationEmailCore,
  studentSubmitApplicationServerFn,
} from "@/lib/server-auth";

describe("Email Validation and Transactional Bounce Prevention Suite", () => {
  describe("validateEmailAddress Unit Tests", () => {
    it("accepts valid educational and personal emails", () => {
      const validEmails = [
        "student@mlrit.ac.in",
        "john.doe@gmail.com",
        "alex_smith123@yahoo.com",
        "candidate@outlook.com",
        "user.name+tag@sub.domain.edu",
      ];

      for (const email of validEmails) {
        const res = validateEmailAddress(email);
        expect(res.isValid).toBe(true);
        expect(res.sanitizedEmail).toBe(email.toLowerCase());
        expect(res.error).toBeUndefined();
      }
    });

    it("rejects malformed syntax and missing parts", () => {
      const malformedEmails = [
        "",
        "   ",
        "plainaddress",
        "@missinglocal.com",
        "missingdomain@",
        "two@@at.com",
        "space in@email.com",
        "trailingdot.@domain.com",
        ".leadingdot@domain.com",
        "consecutive..dots@domain.com",
        "missing-tld@domain",
        "user@domain..com",
      ];

      for (const email of malformedEmails) {
        const res = validateEmailAddress(email);
        expect(res.isValid).toBe(false);
        expect(res.error).toBeDefined();
      }
    });

    it("detects common domain typos and suggests correct spelling", () => {
      const typos = [
        { input: "user@gamil.com", expectedSuggestion: "user@gmail.com" },
        { input: "user@gmial.com", expectedSuggestion: "user@gmail.com" },
        { input: "student@mlrit.com", expectedSuggestion: "student@mlrit.ac.in" },
        { input: "person@yaho.com", expectedSuggestion: "person@yahoo.com" },
        { input: "someone@hotmial.com", expectedSuggestion: "someone@hotmail.com" },
      ];

      for (const { input, expectedSuggestion } of typos) {
        const res = validateEmailAddress(input);
        expect(res.isValid).toBe(false);
        expect(res.suggestion).toBe(expectedSuggestion);
        expect(res.error).toContain("Did you mean");
      }
    });

    it("blocks disposable, temporary, and test domains", () => {
      const disposable = [
        "throwaway@mailinator.com",
        "temp@tempmail.com",
        "test@10minutemail.com",
        "bot@guerrillamail.com",
        "fake@yopmail.com",
      ];

      for (const email of disposable) {
        const res = validateEmailAddress(email);
        expect(res.isValid).toBe(false);
        expect(res.error).toContain("Disposable");
      }

      const testDomainRes = validateEmailAddress("candidate@example.com", { allowTestDomains: false });
      expect(testDomainRes.isValid).toBe(false);
      expect(testDomainRes.error).toContain("Test email domains");
    });

    it("blocks internal placeholder domains from direct public registration", () => {
      const synthetic = [
        "cnf-7eeeb1@equinox.mlrit.ac.in",
        "admin@admin.equinox.internal",
      ];

      for (const email of synthetic) {
        const res = validateEmailAddress(email);
        expect(res.isValid).toBe(false);
        expect(res.error).toContain("Internal placeholder");
      }
    });
  });

  describe("Server Registration Email & Rate Limiting Guard", () => {
    it("rejects registration with misspelled email domain before hitting Supabase", async () => {
      const result = await registerStudentCore({
        fullName: "Test Candidate",
        cnfNumber: "CNF-7EEEB1",
        college: "MLRIT",
        mobile: "9876543210",
        email: "candidate@gamil.com", // typo
        password: "ValidPassword123!",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Did you mean candidate@gmail.com");
      expect(result.user).toBeNull();
    });

    it("rejects registration with disposable email", async () => {
      const result = await registerStudentCore({
        fullName: "Test Candidate",
        cnfNumber: "CNF-7EEEB1",
        college: "MLRIT",
        mobile: "9876543210",
        email: "tempuser@mailinator.com",
        password: "ValidPassword123!",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Disposable");
      expect(result.user).toBeNull();
    });
  });

  describe("Password Reset & Verification Resend Workflow Guards", () => {
    it("validates email before calling password reset", async () => {
      await expect(
        requestPasswordResetCore({
          email: "invalid-email",
        })
      ).rejects.toThrow(/valid email/i);

      await expect(
        requestPasswordResetCore({
          email: "typo@gamil.com",
        })
      ).rejects.toThrow(/Did you mean/i);
    });

    it("validates email before resending verification email", async () => {
      await expect(
        resendVerificationEmailCore({
          email: "notanemail",
        })
      ).rejects.toThrow(/valid email/i);
    });
  });
});
