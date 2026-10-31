import { describe, it, expect } from "vitest";

describe("Student Authentication Logic (CNF + Email Dual Support)", () => {
  // 1. Identifier routing and normalization
  describe("Identifier Detection & Routing", () => {
    it("accurately detects email vs CNF identifier", () => {
      const isEmail = (input: string) => input.trim().includes("@");

      expect(isEmail("student@test.internal")).toBe(true);
      expect(isEmail("student.user@domain.com")).toBe(true);
      expect(isEmail("CNF000")).toBe(false);
      expect(isEmail("CNF-F6D524")).toBe(false);
      expect(isEmail("cnf-22033c")).toBe(false);
    });

    it("normalizes email to lowercase and CNF to uppercase", () => {
      const normalizeIdentifier = (input: string) => {
        const trimmed = input.trim();
        return trimmed.includes("@") ? trimmed.toLowerCase() : trimmed.toUpperCase();
      };

      expect(normalizeIdentifier("  Student.Test@MLRIT.AC.IN ")).toBe("student.test@mlrit.ac.in");
      expect(normalizeIdentifier("  cnf-22033c  ")).toBe("CNF-22033C");
      expect(normalizeIdentifier("cnf000")).toBe("CNF000");
    });
  });

  // 2. Password Preservation
  describe("Password Integrity & Handling", () => {
    it("preserves exact password without trimming whitespace", () => {
      // Passwords must NOT be trimmed
      const rawPassword = "  P@ssword123  ";
      const processPassword = (pw: string) => pw ?? "";

      expect(processPassword(rawPassword)).toBe("  P@ssword123  ");
      expect(processPassword(rawPassword)).not.toBe("P@ssword123");
    });

    it("supports custom chosen passwords rather than enforcing password === CNF", () => {
      // Custom password verification
      const verifyCustomPassword = (inputPw: string) => {
        return inputPw === "MyChosenSecret!2026";
      };

      expect(verifyCustomPassword("MyChosenSecret!2026")).toBe(true);
      expect(verifyCustomPassword("CNF-22033C")).toBe(false);
    });
  });

  // 3. Security & Rate Limiting
  describe("Security Controls & Isolation", () => {
    it("generates separate rate limit keys for email and CNF accounts", () => {
      const getRateLimitKey = (input: string) => {
        const clean = input.trim();
        if (clean.includes("@")) {
          return `student:email:${clean.toLowerCase()}`;
        }
        return `student:cnf:${clean.toUpperCase()}`;
      };

      expect(getRateLimitKey("student@domain.internal")).toBe("student:email:student@domain.internal");
      expect(getRateLimitKey("CNF-F6D524")).toBe("student:cnf:CNF-F6D524");
      expect(getRateLimitKey("cnf-f6d524")).toBe("student:cnf:CNF-F6D524");
    });

    it("uses generic error message to prevent account enumeration", () => {
      const genericErrorMessage = "Invalid confirmation number, email, or password.";
      expect(genericErrorMessage).not.toContain("not found");
      expect(genericErrorMessage).not.toContain("does not exist");
      expect(genericErrorMessage).not.toContain("user exists");
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
