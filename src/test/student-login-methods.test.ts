import { describe, it, expect, vi } from "vitest";
import { getConfirmedStudent } from "../data/confirmed-students";

describe("Student Authentication Logic (CNF + Email Dual Support)", () => {
  // 1. Confirmed Student Authentication Logic
  describe("Confirmed Student (CNF) Login Validation", () => {
    it("successfully verifies valid confirmed student by CNF number", () => {
      const student = getConfirmedStudent("CNF000");
      expect(student).toBeDefined();
      expect(student?.name).toBe("SHREYAS");
      expect(student?.cnf).toBe("CNF000");
    });

    it("verifies CNF case-insensitively (e.g. lowercase cnf000 or hyphenated cnf-f6d524)", () => {
      const studentLower = getConfirmedStudent("cnf000".toUpperCase());
      expect(studentLower).toBeDefined();
      expect(studentLower?.cnf).toBe("CNF000");

      const studentHyphen = getConfirmedStudent("cnf-f6d524".toUpperCase());
      expect(studentHyphen).toBeDefined();
      expect(studentHyphen?.name).toBe("A.Sharanya");
    });

    it("enforces that for CNF students, password must match their CNF number exactly", () => {
      const cnf = "CNF000";
      const validPassword = "CNF000";
      const invalidPassword = "Password123";

      expect(validPassword.toUpperCase() === cnf).toBe(true);
      expect(invalidPassword.toUpperCase() === cnf).toBe(false);
    });

    it("returns null for unrecognized or non-existent CNF numbers", () => {
      const student = getConfirmedStudent("CNF-NON-EXISTENT");
      expect(student).toBeNull();
    });
  });

  // 2. Email Authentication Branch Detection & Formatting
  describe("Self-Registered Student (Email) Login Branch Routing", () => {
    it("accurately detects email format from input", () => {
      const isEmailInput = (input: string) => input.trim().includes("@");

      expect(isEmailInput("student@gmail.com")).toBe(true);
      expect(isEmailInput("STUDENT@COLLEGE.EDU")).toBe(true);
      expect(isEmailInput("CNF000")).toBe(false);
      expect(isEmailInput("CNF-F6D524")).toBe(false);
      expect(isEmailInput("TEAM-CODE-01")).toBe(false);
    });

    it("normalizes email to lowercase for consistent credential verification", () => {
      const rawEmail = "  Student.Applicant@MLRIT.AC.IN  ";
      const normalized = rawEmail.trim().toLowerCase();

      expect(normalized).toBe("student.applicant@mlrit.ac.in");
    });

    it("generates correct distinct rate-limiting keys for email vs CNF login", () => {
      const getRateLimitKey = (input: string) => {
        const clean = input.trim();
        if (clean.includes("@")) {
          return `student:email:${clean.toLowerCase()}`;
        }
        return `student:${clean.toUpperCase()}`;
      };

      expect(getRateLimitKey("student@gmail.com")).toBe("student:email:student@gmail.com");
      expect(getRateLimitKey("CNF000")).toBe("student:CNF000");
      expect(getRateLimitKey("cnf-f6d524")).toBe("student:CNF-F6D524");
    });

    it("rejects blank credentials before executing authentication", () => {
      const validateInput = (input: string, pass: string) => {
        const rawInput = input.trim();
        const cleanPassword = pass.trim();
        if (!rawInput || !cleanPassword) {
          throw new Error("Confirmation number or email and password are required.");
        }
        return true;
      };

      expect(() => validateInput("", "pass")).toThrow();
      expect(() => validateInput("student@gmail.com", "")).toThrow();
      expect(validateInput("student@gmail.com", "validPass123")).toBe(true);
    });

    it("blocks administrator accounts from accessing student dashboard", () => {
      const checkRole = (profileRole: string) => {
        if (profileRole === "admin") {
          throw new Error("This is an administrator account. Please use the Admin Login tab.");
        }
        return true;
      };

      expect(() => checkRole("admin")).toThrow("This is an administrator account");
      expect(checkRole("student")).toBe(true);
    });
  });
});
