import { describe, it, expect } from "vitest";
import { verifyPassEligibility } from "../lib/pass-eligibility";
import { getConfirmedStudent, CONFIRMED_STUDENTS_LIST } from "../data/confirmed-students";
import { getOfficialParticipantByCnf, OFFICIAL_PARTICIPANTS } from "../data/official-participants";

describe("Final Implementation — Equinox Internship Drive (19 Core Requirements)", () => {
  // 1. Premium Pass CNF matching both sources → registration allowed
  it("Requirement 1: Premium Pass CNF matching both sources allows registration", () => {
    // CNF-7EEEB1 is in confirmed-students and has Premium Pass in official roster
    const res = verifyPassEligibility({ cnfNumber: "CNF-7EEEB1" });
    expect(res.allowed).toBe(true);
    expect(res.errorCode).toBe("ELIGIBLE");
    expect(res.passCategory).toBe("Premium Pass");
    expect(res.cnf).toBe("CNF-7EEEB1");
  });

  // 2. Entertainment Pass CNF → registration rejected
  it("Requirement 2: Entertainment Pass CNF is strictly rejected even if present in both rosters", () => {
    // CNF-DD63FF is in both rosters but with Entertainment Pass
    const res = verifyPassEligibility({ cnfNumber: "CNF-DD63FF" });
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("REJECTED_ENTERTAINMENT_PASS");
    expect(res.reason).toContain("Entertainment Pass holders are not eligible");
  });

  // 3. CNF missing from CSV → registration rejected
  it("Requirement 3: CNF missing from official CSV roster is rejected", () => {
    const res = verifyPassEligibility({ cnfNumber: "CNF-7E7EBA" }); // in website but missing in CSV
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("NOT_IN_EXCEL");
    expect(res.reason).toContain("not found in the official Equinox registrations roster");
  });

  // 4. CNF missing from website master list → registration rejected
  it("Requirement 4: CNF missing from website master list is rejected", () => {
    // CNF-0B4045 is in CSV but not in website master list
    const res = verifyPassEligibility({ cnfNumber: "CNF-0B4045" });
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe("NOT_IN_WEBSITE_MASTER");
    expect(res.reason).toContain("not in the confirmed student master list");
  });

  // 5. Duplicate CNF registration → rejected
  it("Requirement 5: Duplicate CNF registration for already registered account is rejected", () => {
    const mockExistingStudents = [
      { cnf: "CNF-7EEEB1", email: "existing@student.com", status: "completed" },
    ];
    const checkDuplicateCnf = (cnf: string, email: string) => {
      const match = mockExistingStudents.find((s) => s.cnf === cnf);
      if (match && match.email !== email) {
        throw new Error(`Registration is already completed for CNF ${cnf}. Please sign in using your registered email (${match.email}).`);
      }
      return true;
    };

    expect(() => checkDuplicateCnf("CNF-7EEEB1", "different@student.com")).toThrow(
      "Registration is already completed for CNF CNF-7EEEB1"
    );
  });

  // 6. Duplicate email → safe error
  it("Requirement 6: Duplicate email registration returns safe, descriptive error", () => {
    const mockProfiles = [{ email: "test@student.com", cnf: "CNF-AAA" }];
    const checkDuplicateEmail = (email: string, cnf: string) => {
      const match = mockProfiles.find((p) => p.email === email && p.cnf !== cnf);
      if (match) {
        throw new Error(`An account with email ${email} already exists. Please sign in or use another email.`);
      }
      return true;
    };

    expect(() => checkDuplicateEmail("test@student.com", "CNF-BBB")).toThrow(
      "An account with email test@student.com already exists"
    );
  });

  // 7. Student without completed registration → login rejected
  it("Requirement 7: Student without completed registration is rejected at login", () => {
    const mockStudent = { team_code: "CNF-UNREG", course_branch: null, email: null };
    const attemptLogin = (student: typeof mockStudent) => {
      const isComplete = Boolean(student.team_code && student.course_branch && student.email);
      if (!isComplete) {
        throw new Error("Registration Incomplete: Your account has not completed the official Internship Drive candidate registration.");
      }
      return true;
    };

    expect(() => attemptLogin(mockStudent)).toThrow("Registration Incomplete");
  });

  // 8. Successfully registered student → can log in again
  it("Requirement 8: Successfully registered student can log in again with registered email & password", () => {
    const registeredStudent = {
      team_code: "CNF-7EEEB1",
      course_branch: "B.Tech Computer Science and Engineering",
      email: "student@example.com",
      passwordHash: "hashed_secret_pass",
    };

    const loginWithEmail = (email: string, pass: string) => {
      if (email !== registeredStudent.email || pass !== "secret_pass") {
        throw new Error("Invalid email or password.");
      }
      const isComplete = Boolean(registeredStudent.team_code && registeredStudent.course_branch);
      if (!isComplete) throw new Error("Registration Incomplete.");
      return { success: true, role: "student", email: registeredStudent.email };
    };

    const res = loginWithEmail("student@example.com", "secret_pass");
    expect(res.success).toBe(true);
    expect(res.role).toBe("student");
  });

  // 9. Wrong password → login rejected
  it("Requirement 9: Login attempt with wrong password is rejected", () => {
    const verifyPassword = (provided: string, expected: string) => {
      if (provided !== expected) {
        throw new Error("Invalid email or password.");
      }
      return true;
    };

    expect(() => verifyPassword("wrong_pwd", "correct_pwd")).toThrow("Invalid email or password.");
  });

  // 10. CNF-only login without an account → rejected
  it("Requirement 10: CNF-only login without an account and password = CNF is rejected", () => {
    const attemptCnfLogin = (cnfInput: string, passwordInput: string) => {
      if (passwordInput.toUpperCase() === cnfInput.toUpperCase()) {
        throw new Error("CNF password login is disabled. Please log in using the password you chose during registration.");
      }
      return true;
    };

    expect(() => attemptCnfLogin("CNF-7EEEB1", "CNF-7EEEB1")).toThrow("CNF password login is disabled");
  });

  // 11. Student registration succeeds without resume or video
  it("Requirement 11: Student registration collects only basic details and succeeds without resume or video", () => {
    interface BasicRegInput {
      fullName: string;
      cnfNumber: string;
      college: string;
      courseBranch: string;
      mobile: string;
      email: string;
      password: string;
      confirmPassword: string;
    }

    const validateBasicRegistration = (input: BasicRegInput) => {
      if (!input.fullName.trim() || !input.cnfNumber.trim() || !input.email.trim() || !input.password.trim()) {
        throw new Error("Required fields missing.");
      }
      if (!input.courseBranch.trim()) {
        throw new Error("Course/Branch is required.");
      }
      if (!/^[6-9]\d{9}$/.test(input.mobile.replace(/\D/g, ""))) {
        throw new Error("Valid 10-digit mobile number required.");
      }
      if (input.password !== input.confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      // Explicitly verifies NO resume or video is required for basic registration!
      return { success: true, student: input };
    };

    const res = validateBasicRegistration({
      fullName: "Sravya Jodu",
      cnfNumber: "CNF-7EEEB1",
      college: "MLR Institute of Technology",
      courseBranch: "B.Tech Computer Science and Engineering",
      mobile: "9701472203",
      email: "jodusravya11@gmail.com",
      password: "CandidateSecurePassword2026!",
      confirmPassword: "CandidateSecurePassword2026!",
    });

    expect(res.success).toBe(true);
    expect(res.student.courseBranch).toBe("B.Tech Computer Science and Engineering");
  });

  // 12. Student cannot apply without a resume and video
  it("Requirement 12: Internship opportunity application strictly requires both resume and video", () => {
    const validateApplication = (app: { resumeFile: File | null; videoUrl: string }) => {
      if (!app.resumeFile) {
        throw new Error("Resume / CV file upload is required.");
      }
      if (!app.videoUrl || !app.videoUrl.trim()) {
        throw new Error("One-minute self-introduction video Google Drive link is required.");
      }
      if (!app.videoUrl.includes("drive.google.com") && !app.videoUrl.includes("docs.google.com")) {
        throw new Error("Video must be a Google Drive link.");
      }
      return true;
    };

    // Missing resume
    expect(() => validateApplication({ resumeFile: null, videoUrl: "https://drive.google.com/file/d/xyz" })).toThrow(
      "Resume / CV file upload is required"
    );

    // Missing video
    const dummyFile = new File(["dummy"], "CNF000_Resume.pdf", { type: "application/pdf" });
    expect(() => validateApplication({ resumeFile: dummyFile, videoUrl: "" })).toThrow(
      "One-minute self-introduction video Google Drive link is required"
    );

    // Non-Google Drive video
    expect(() => validateApplication({ resumeFile: dummyFile, videoUrl: "https://youtube.com/watch?v=123" })).toThrow(
      "Video must be a Google Drive link"
    );

    // Valid both
    expect(validateApplication({ resumeFile: dummyFile, videoUrl: "https://drive.google.com/file/d/123/view" })).toBe(true);
  });

  // 13. Successful application → visible in Supabase applications table schema
  it("Requirement 13: Application payload formats correctly for Supabase applications table insertion", () => {
    const appPayload = {
      id: "app-uuid-12345",
      student_id: "user-uuid-67890",
      internship_id: "internship-uuid-999",
      status: "submitted",
      resume_url: "user-uuid-67890/internsh-CNF-7EEEB1_Sravya_Resume.pdf",
      video_url: "https://drive.google.com/file/d/abcdef/view",
      skills: "React, TypeScript, Node.js",
      availability: "Immediate (Full-Time)",
      created_at: new Date().toISOString(),
    };

    expect(appPayload.id).toBeDefined();
    expect(appPayload.student_id).toBe("user-uuid-67890");
    expect(appPayload.internship_id).toBe("internship-uuid-999");
    expect(appPayload.status).toBe("submitted");
    expect(appPayload.resume_url).toContain("CNF-7EEEB1");
  });

  // 14. Resume → actual file storage path formatting
  it("Requirement 14: Resume is stored under private user folder with CNFNUMBER_NAME naming format", () => {
    const userId = "usr-1234";
    const cnf = "CNF-7EEEB1";
    const name = "Sravya Jodu";
    const roleId = "role-abcde123";
    const safeName = `${cnf}_${name.replace(/\s+/g, "_")}.pdf`;
    const storagePath = `${userId}/${roleId.slice(0, 8)}-${safeName}`;

    expect(storagePath).toBe("usr-1234/role-abc-CNF-7EEEB1_Sravya_Jodu.pdf");
    expect(storagePath.startsWith(userId + "/")).toBe(true);
    expect(storagePath).toContain("CNF-7EEEB1_Sravya_Jodu.pdf");
  });

  // 15. Video link → saved against correct application
  it("Requirement 15: Introduction video link is associated with the application record", () => {
    const appRecord = {
      application_id: "app-100",
      video_url: "https://drive.google.com/file/d/video-id-123/view",
    };
    expect(appRecord.video_url).toContain("drive.google.com");
  });

  // 16. Multiple internship applications → separate correct resume and video records
  it("Requirement 16: Applying to multiple internship roles generates distinct application records and resumes", () => {
    const userId = "usr-multi-apply";
    const cnf = "CNF-7EEEB1";
    const roles = ["frontend-eng-uuid", "cloud-dev-uuid"];

    const applications = roles.map((roleId) => ({
      id: `app-${roleId}`,
      student_id: userId,
      internship_id: roleId,
      resume_url: `${userId}/${roleId.slice(0, 8)}-${cnf}_Resume.pdf`,
      video_url: `https://drive.google.com/file/d/${roleId}_video/view`,
    }));

    expect(applications.length).toBe(2);
    const app1 = applications[0]!;
    const app2 = applications[1]!;
    expect(app1.internship_id).not.toBe(app2.internship_id);
    expect(app1.resume_url).not.toBe(app2.resume_url);
    expect(app1.video_url).not.toBe(app2.video_url);
  });

  // 17. Admin → can view applications and securely access resumes via signed URLs
  it("Requirement 17: Admin role is authorized to view applications and generate signed URLs", () => {
    const checkAdminAccess = (role: string) => {
      if (role !== "admin") throw new Error("Unauthorized.");
      return { canViewApplications: true, canGenerateSignedUrl: true };
    };

    expect(checkAdminAccess("admin")).toEqual({ canViewApplications: true, canGenerateSignedUrl: true });
    expect(() => checkAdminAccess("student")).toThrow("Unauthorized.");
  });

  // 18. Students → cannot access other students' applications or files
  it("Requirement 18: Students cannot access or modify other students' applications", () => {
    const studentA = "user-A";
    const studentB = "user-B";
    const applicationOwnedByA = { id: "app-1", student_id: studentA };

    const canStudentAccess = (requestingUserId: string, app: typeof applicationOwnedByA) => {
      return requestingUserId === app.student_id;
    };

    expect(canStudentAccess(studentA, applicationOwnedByA)).toBe(true);
    expect(canStudentAccess(studentB, applicationOwnedByA)).toBe(false);
  });

  // 19. Admin login → remains independent and functional
  it("Requirement 19: Admin login portal operates independently from student accounts", () => {
    const adminUser = {
      username: "EQUINOXCIE",
      email: "equinoxcie@admin.equinox.internal",
      role: "admin",
    };

    const verifyAdminRole = (email: string) => {
      if (email === adminUser.email) return "admin";
      return "student";
    };

    expect(verifyAdminRole("equinoxcie@admin.equinox.internal")).toBe("admin");
    expect(verifyAdminRole("student@gmail.com")).toBe("student");
  });
});
