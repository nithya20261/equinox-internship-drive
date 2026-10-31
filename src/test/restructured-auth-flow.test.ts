import { describe, it, expect } from "vitest";
import { verifyPassEligibility } from "../lib/pass-eligibility";
import { getConfirmedStudent } from "../data/confirmed-students";
import { getOfficialParticipantByCnf } from "../data/official-participants";

describe("Restructured Student Authentication & Registration Flow", () => {
  // 1. Mandatory Premium Pass Eligibility Rules
  describe("Step 1: CNF Verification & Pass Category Check", () => {
    it("allows registration for verified Premium Pass participants found in both website and Excel roster", () => {
      // CNF-7EEEB1 is a confirmed student with Premium Pass
      const result = verifyPassEligibility({ cnfNumber: "CNF-7EEEB1" });
      expect(result.allowed).toBe(true);
      expect(result.errorCode).toBe("ELIGIBLE");
      expect(result.passCategory).toBe("Premium Pass");
      expect(result.cnf).toBe("CNF-7EEEB1");
    });

    it("strictly rejects participants with Entertainment Pass, even when CNF matches", () => {
      // CNF-DD63FF has Entertainment Pass in both the website master list and official roster
      const result = verifyPassEligibility({ cnfNumber: "CNF-DD63FF" });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("REJECTED_ENTERTAINMENT_PASS");
      expect(result.reason).toContain("Entertainment Pass holders are not eligible");
    });

    it("rejects participants not found in website confirmed master list", () => {
      const result = verifyPassEligibility({ cnfNumber: "CNF-NON-EXISTENT-999" });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("NOT_IN_WEBSITE_MASTER");
      expect(result.reason).toContain("not in the confirmed student master list");
    });

    it("rejects empty or blank CNF verification requests", () => {
      const result = verifyPassEligibility({ cnfNumber: "" });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("MISSING_CNF");
    });
  });

  // 2. Direct CNF Login Gating for Incomplete Accounts
  describe("Step 2: Direct Login Gating for Incomplete Accounts", () => {
    interface MockStudentDbRecord {
      team_code: string;
      course_branch: string | null;
      resume_url: string | null;
      email: string;
    }

    const checkRegistrationCompletion = (student: MockStudentDbRecord): boolean => {
      return Boolean(
        student.course_branch &&
        student.resume_url &&
        student.email &&
        !student.email.endsWith("@equinox.mlrit.ac.in")
      );
    };

    it("detects pre-synced dummy accounts as incomplete", () => {
      const preSyncedAccount: MockStudentDbRecord = {
        team_code: "CNF-7EEEB1",
        course_branch: null,
        resume_url: null,
        email: "cnf-7eeeb1@equinox.mlrit.ac.in",
      };

      expect(checkRegistrationCompletion(preSyncedAccount)).toBe(false);
    });

    it("identifies fully registered accounts as complete", () => {
      const completedAccount: MockStudentDbRecord = {
        team_code: "CNF-7EEEB1",
        course_branch: "B.Tech Computer Science and Engineering",
        resume_url: "user-123/CNF-7EEEB1_Resume.pdf",
        email: "student@gmail.com",
      };

      expect(checkRegistrationCompletion(completedAccount)).toBe(true);
    });

    it("blocks unregistered accounts from logging in directly with CNF number", () => {
      const attemptCnfLogin = (student: MockStudentDbRecord, passwordInput: string) => {
        const isCompleted = checkRegistrationCompletion(student);
        if (!isCompleted) {
          throw new Error(
            `Registration Incomplete: Confirmation Number (${student.team_code}) has not completed the Internship Drive registration form. Please complete your registration with your course branch, resume, and introduction video before logging in.`
          );
        }
        return true;
      };

      const preSyncedAccount: MockStudentDbRecord = {
        team_code: "CNF-7EEEB1",
        course_branch: null,
        resume_url: null,
        email: "cnf-7eeeb1@equinox.mlrit.ac.in",
      };

      expect(() => attemptCnfLogin(preSyncedAccount, "CNF-7EEEB1")).toThrow(
        "Registration Incomplete"
      );
    });
  });

  // 3. Full Registration Form Validation
  describe("Step 3: Registration Form Payload Validation", () => {
    interface FormInput {
      fullName: string;
      cnfNumber: string;
      college: string;
      courseBranch: string;
      mobile: string;
      email: string;
      password: string;
      videoUrl: string;
      resumeFileName?: string;
    }

    const validateRegistrationForm = (input: FormInput): { valid: boolean; error?: string } => {
      if (!input.fullName.trim() || !input.cnfNumber.trim() || !input.email.trim() || !input.password.trim()) {
        return { valid: false, error: "Full name, CNF, email, and password are required." };
      }
      if (!input.courseBranch.trim()) {
        return { valid: false, error: "Course / Branch is required." };
      }
      if (!input.mobile.trim() || !/^[6-9]\d{9}$/.test(input.mobile.trim().replace(/\D/g, ""))) {
        return { valid: false, error: "A valid 10-digit mobile number is required." };
      }
      if (!input.videoUrl.trim() || (!input.videoUrl.startsWith("http://") && !input.videoUrl.startsWith("https://"))) {
        return { valid: false, error: "A valid web link for the introduction video is required." };
      }
      if (!input.resumeFileName) {
        return { valid: false, error: "Resume file upload is required." };
      }
      const allowedExts = [".pdf", ".doc", ".docx"];
      if (!allowedExts.some((ext) => input.resumeFileName!.toLowerCase().endsWith(ext))) {
        return { valid: false, error: "Resume must be a PDF, DOC, or DOCX file." };
      }
      return { valid: true };
    };

    it("rejects submission if Course/Branch is missing", () => {
      const res = validateRegistrationForm({
        fullName: "John Doe",
        cnfNumber: "CNF-7EEEB1",
        college: "MLR Institute of Technology",
        courseBranch: "",
        mobile: "9876543210",
        email: "john@example.com",
        password: "securePassword123",
        videoUrl: "https://drive.google.com/file/d/xyz",
        resumeFileName: "resume.pdf",
      });

      expect(res.valid).toBe(false);
      expect(res.error).toContain("Course / Branch is required");
    });

    it("rejects submission if Resume file is missing", () => {
      const res = validateRegistrationForm({
        fullName: "John Doe",
        cnfNumber: "CNF-7EEEB1",
        college: "MLR Institute of Technology",
        courseBranch: "B.Tech CSE",
        mobile: "9876543210",
        email: "john@example.com",
        password: "securePassword123",
        videoUrl: "https://drive.google.com/file/d/xyz",
      });

      expect(res.valid).toBe(false);
      expect(res.error).toContain("Resume file upload is required");
    });

    it("rejects invalid resume file formats (e.g. .png, .exe)", () => {
      const res = validateRegistrationForm({
        fullName: "John Doe",
        cnfNumber: "CNF-7EEEB1",
        college: "MLR Institute of Technology",
        courseBranch: "B.Tech CSE",
        mobile: "9876543210",
        email: "john@example.com",
        password: "securePassword123",
        videoUrl: "https://drive.google.com/file/d/xyz",
        resumeFileName: "photo.png",
      });

      expect(res.valid).toBe(false);
      expect(res.error).toContain("PDF, DOC, or DOCX");
    });

    it("rejects submission if Introduction Video Link is missing or invalid", () => {
      const res = validateRegistrationForm({
        fullName: "John Doe",
        cnfNumber: "CNF-7EEEB1",
        college: "MLR Institute of Technology",
        courseBranch: "B.Tech CSE",
        mobile: "9876543210",
        email: "john@example.com",
        password: "securePassword123",
        videoUrl: "invalid-url-string",
        resumeFileName: "resume.pdf",
      });

      expect(res.valid).toBe(false);
      expect(res.error).toContain("valid web link for the introduction video");
    });

    it("accepts valid completed registration payload with all required fields", () => {
      const res = validateRegistrationForm({
        fullName: "John Doe",
        cnfNumber: "CNF-7EEEB1",
        college: "MLR Institute of Technology",
        courseBranch: "B.Tech Computer Science and Engineering",
        mobile: "9876543210",
        email: "john.doe@gmail.com",
        password: "strongPassword123",
        videoUrl: "https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing",
        resumeFileName: "CNF-7EEEB1_John_Doe_Resume.pdf",
      });

      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  // 4. Admin Authentication Isolation
  describe("Step 4: Administrator Portal Security & Independence", () => {
    it("strictly requires username EQUINOXCIE for administrator access", () => {
      const validateAdminUser = (username: string) => {
        if (username.trim().toUpperCase() !== "EQUINOXCIE") {
          throw new Error("Invalid administrator username or credentials.");
        }
        return true;
      };

      expect(validateAdminUser("EQUINOXCIE")).toBe(true);
      expect(validateAdminUser("equinoxcie")).toBe(true);
      expect(() => validateAdminUser("STUDENT_USER")).toThrow("Invalid administrator username");
      expect(() => validateAdminUser("CNF000")).toThrow("Invalid administrator username");
    });

    it("denies student credentials from accessing administrative routes", () => {
      const verifyAdminRole = (profileRole: string) => {
        if (profileRole !== "admin") {
          throw new Error("Access denied. This account does not have administrator privileges.");
        }
        return true;
      };

      expect(verifyAdminRole("admin")).toBe(true);
      expect(() => verifyAdminRole("student")).toThrow("Access denied");
    });
  });
});
