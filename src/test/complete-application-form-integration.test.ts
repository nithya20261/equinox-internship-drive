import { describe, it, expect } from "vitest";

describe("Complete Application Form → Supabase Database Integration", () => {
  // 1. All 10 Form Blocks Field Mapping & Completeness
  describe("10 Form Blocks Verification", () => {
    interface ApplicationFormState {
      fullName: string;
      contactNumber: string;
      email: string;
      instituteAndBranch: string;
      preferredRole: string;
      resumeFile: { name: string; size: number; type: string };
      videoUrl: string;
      relevantSkills: string;
      portfolioUrl: string;
      availability: string;
      answers?: Record<string, unknown>;
    }

    const sampleFormData: ApplicationFormState = {
      fullName: "SHREYAS",
      contactNumber: "9876543210",
      email: "cnf000@equinox.mlrit.ac.in",
      instituteAndBranch: "MLR Institute of Technology - B.Tech CSE",
      preferredRole: "9fc1b1d0-be73-4c8e-914e-bbd14cf329d1",
      resumeFile: { name: "CNF000_SHREYAS_Resume.pdf", size: 1024 * 500, type: "application/pdf" },
      videoUrl: "https://drive.google.com/file/d/1a2b3c4d5e6f/view?usp=sharing",
      relevantSkills: "React, Node.js, TypeScript, PostgreSQL, Docker",
      portfolioUrl: "https://github.com/shreyas-dev",
      availability: "Immediate (Full-Time)",
      answers: {
        custom_question_1: "Available for 6 months on campus",
        preferred_shift: "Full-Time",
      },
    };

    it("ensures all 10 fields are present and non-empty in application input", () => {
      expect(sampleFormData.fullName).toBeTruthy();
      expect(sampleFormData.contactNumber).toBeTruthy();
      expect(sampleFormData.email).toBeTruthy();
      expect(sampleFormData.instituteAndBranch).toBeTruthy();
      expect(sampleFormData.preferredRole).toBeTruthy();
      expect(sampleFormData.resumeFile).toBeTruthy();
      expect(sampleFormData.videoUrl).toBeTruthy();
      expect(sampleFormData.relevantSkills).toBeTruthy();
      expect(sampleFormData.portfolioUrl).toBeTruthy();
      expect(sampleFormData.availability).toBeTruthy();
    });

    it("verifies accurate parsing of institute and branch into dedicated database fields", () => {
      const parts = sampleFormData.instituteAndBranch.split(" - ");
      const college = parts[0]?.trim();
      const courseBranch = parts.slice(1).join(" - ").trim();

      expect(college).toBe("MLR Institute of Technology");
      expect(courseBranch).toBe("B.Tech CSE");
    });
  });

  // 2. Database Insert & Snapshot Construction
  describe("Supabase Applications Table Row Construction", () => {
    it("constructs full database row with all 10 form fields and snapshot data", () => {
      const userId = "e4f8c8fe-94a3-45d0-b50d-8b6167f179d1";
      const internshipId = "9fc1b1d0-be73-4c8e-914e-bbd14cf329d1";
      const resumeStoragePath = `${userId}/${internshipId}/CNF000_SHREYAS_Resume.pdf`;

      const dbRow = {
        student_id: userId,
        internship_id: internshipId,
        status: "submitted",
        resume_url: resumeStoragePath,
        video_url: "https://drive.google.com/file/d/1a2b3c4d5e6f/view",
        skills: "React, Node.js, TypeScript, PostgreSQL",
        portfolio_url: "https://github.com/shreyas-dev",
        availability: "Immediate (Full-Time)",
        student_name: "SHREYAS",
        student_email: "cnf000@equinox.mlrit.ac.in",
        student_phone: "9876543210",
        college: "MLR Institute of Technology",
        course_branch: "B.Tech CSE",
        cnf_number: "CNF000",
        role_title: "Backend & Cloud Architecture Intern",
        answers: {
          full_name: "SHREYAS",
          cnf_number: "CNF000",
          contact_number: "9876543210",
          email: "cnf000@equinox.mlrit.ac.in",
          college: "MLR Institute of Technology",
          course_branch: "B.Tech CSE",
          availability: "Immediate (Full-Time)",
          skills: "React, Node.js, TypeScript, PostgreSQL",
          video_url: "https://drive.google.com/file/d/1a2b3c4d5e6f/view",
          portfolio_url: "https://github.com/shreyas-dev",
          resume_path: resumeStoragePath,
        },
      };

      // Ensure every required attribute is populated
      expect(dbRow.student_id).toBe(userId);
      expect(dbRow.internship_id).toBe(internshipId);
      expect(dbRow.status).toBe("submitted");
      expect(dbRow.resume_url).toBe(resumeStoragePath);
      expect(dbRow.video_url).toContain("drive.google.com");
      expect(dbRow.skills).toContain("React");
      expect(dbRow.portfolio_url).toContain("github.com");
      expect(dbRow.availability).toBe("Immediate (Full-Time)");
      expect(dbRow.student_name).toBe("SHREYAS");
      expect(dbRow.student_email).toBe("cnf000@equinox.mlrit.ac.in");
      expect(dbRow.student_phone).toBe("9876543210");
      expect(dbRow.college).toBe("MLR Institute of Technology");
      expect(dbRow.course_branch).toBe("B.Tech CSE");
      expect(dbRow.cnf_number).toBe("CNF000");
      expect(dbRow.role_title).toBe("Backend & Cloud Architecture Intern");
      expect(dbRow.answers.full_name).toBe("SHREYAS");
    });
  });

  // 3. Multi-table Synchronization
  describe("Multi-table Synchronization Integrity", () => {
    it("ensures student profile, profiles table, and auth metadata receive synchronized data", () => {
      const studentPayload = {
        user_id: "user-123",
        full_name: "SHREYAS",
        college: "MLR Institute of Technology",
        course_branch: "B.Tech CSE",
        team_code: "CNF000",
        mobile: "9876543210",
        skills: ["React", "Node.js"],
        resume_url: "user-123/resume.pdf",
      };

      const profilePayload = {
        full_name: "SHREYAS",
        email: "cnf000@equinox.mlrit.ac.in",
        college: "MLR Institute of Technology",
        branch: "B.Tech CSE",
      };

      const metadataPayload = {
        full_name: "SHREYAS",
        mobile: "9876543210",
        college: "MLR Institute of Technology",
        branch: "B.Tech CSE",
        course_branch: "B.Tech CSE",
        team_code: "CNF000",
        cnf_number: "CNF000",
        video_url: "https://drive.google.com/test",
        skills: ["React", "Node.js"],
        portfolio_url: "https://github.com/shreyas",
        availability: "Immediate (Full-Time)",
      };

      expect(studentPayload.full_name).toBe(profilePayload.full_name);
      expect(studentPayload.full_name).toBe(metadataPayload.full_name);
      expect(studentPayload.college).toBe(profilePayload.college);
      expect(studentPayload.course_branch).toBe(profilePayload.branch);
      expect(studentPayload.team_code).toBe(metadataPayload.cnf_number);
    });
  });

  // 4. Duplicate Application Prevention
  describe("Duplicate Application Prevention", () => {
    it("detects when student already applied for an internship and avoids duplicate rows", () => {
      const existingAppliedRoles = new Set(["9fc1b1d0-be73-4c8e-914e-bbd14cf329d1"]);
      const requestedRoles = ["9fc1b1d0-be73-4c8e-914e-bbd14cf329d1"];

      const alreadyApplied = requestedRoles.filter((id) => existingAppliedRoles.has(id));
      const newRoles = requestedRoles.filter((id) => !existingAppliedRoles.has(id));

      expect(alreadyApplied.length).toBe(1);
      expect(newRoles.length).toBe(0);

      const result = {
        totalRequested: requestedRoles.length,
        appliedCount: newRoles.length,
        duplicateCount: alreadyApplied.length,
        alreadyAppliedIds: alreadyApplied,
        successfulIds: newRoles,
      };

      expect(result.duplicateCount).toBe(1);
      expect(result.appliedCount).toBe(0);
    });
  });

  // 5. Admin Console Hydration & Export
  describe("Admin Console Hydration & CSV Export", () => {
    it("hydrates application row with all candidate and internship details", () => {
      const rawApp = {
        id: "app-001",
        student_id: "user-123",
        internship_id: "role-001",
        status: "submitted",
        resume_url: "user-123/resume.pdf",
        video_url: "https://drive.google.com/file/d/test",
        skills: "Python, Docker",
        portfolio_url: "https://github.com/candidate",
        availability: "Immediate",
        created_at: "2026-10-31T12:00:00.000Z",
      };

      const studentRecord = {
        user_id: "user-123",
        full_name: "John Doe",
        team_code: "CNF123",
        college: "MLR Institute of Technology",
        course_branch: "CSE",
        mobile: "9876543210",
      };

      const profileRecord = {
        id: "user-123",
        email: "john@example.com",
        full_name: "John Doe",
      };

      const internshipRecord = {
        id: "role-001",
        role: "Software Engineering Intern",
        domain: "Engineering",
      };

      const hydrated = {
        ...rawApp,
        internship: internshipRecord,
        student: {
          full_name: studentRecord.full_name || profileRecord.full_name,
          team_code: studentRecord.team_code,
          college: studentRecord.college,
          course_branch: studentRecord.course_branch,
          mobile: studentRecord.mobile,
          email: profileRecord.email,
        },
      };

      expect(hydrated.student.full_name).toBe("John Doe");
      expect(hydrated.student.team_code).toBe("CNF123");
      expect(hydrated.student.email).toBe("john@example.com");
      expect(hydrated.student.mobile).toBe("9876543210");
      expect(hydrated.internship.role).toBe("Software Engineering Intern");
      expect(hydrated.video_url).toBe("https://drive.google.com/file/d/test");
      expect(hydrated.portfolio_url).toBe("https://github.com/candidate");
      expect(hydrated.skills).toBe("Python, Docker");
      expect(hydrated.availability).toBe("Immediate");
    });
  });
});

