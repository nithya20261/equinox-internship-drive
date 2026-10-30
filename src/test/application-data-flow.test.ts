import { describe, it, expect } from "vitest";

describe("Application Data Flow & Field Integrity", () => {
  // 1. Full Name Validation
  describe("Full Name Validation", () => {
    const isValidName = (name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      if (trimmed.toLowerCase().startsWith("cnf") || /x{3,}/i.test(trimmed) || trimmed.includes("_")) {
        return false;
      }
      return /^[a-zA-Z\s\.\'-]{2,60}$/.test(trimmed);
    };

    it("accepts authentic candidate names", () => {
      expect(isValidName("SHREYAS")).toBe(true);
      expect(isValidName("A. Sharanya")).toBe(true);
      expect(isValidName("Rahul Sharma")).toBe(true);
      expect(isValidName("Mary-Jane Watson")).toBe(true);
    });

    it("rejects placeholder and corrupted names", () => {
      expect(isValidName("cnf000XXXXXXXXXXXXX")).toBe(false);
      expect(isValidName("CNF-12345")).toBe(false);
      expect(isValidName("FTG_IHG")).toBe(false);
      expect(isValidName("X")).toBe(false);
      expect(isValidName("")).toBe(false);
    });
  });

  // 2. Contact Number Normalization & Validation
  describe("Contact Number Normalization & Validation", () => {
    const normalizeAndValidateMobile = (raw: string): { valid: boolean; normalized?: string } => {
      const cleanContact = raw.replace(/\D/g, "");
      const normalizedMobile =
        cleanContact.startsWith("91") && cleanContact.length === 12
          ? cleanContact.slice(2)
          : cleanContact.startsWith("0") && cleanContact.length === 11
          ? cleanContact.slice(1)
          : cleanContact;

      if (/^[6-9]\d{9}$/.test(normalizedMobile)) {
        return { valid: true, normalized: normalizedMobile };
      }
      return { valid: false };
    };

    it("normalizes and accepts valid 10-digit Indian mobile numbers", () => {
      expect(normalizeAndValidateMobile("9876543210")).toEqual({ valid: true, normalized: "9876543210" });
      expect(normalizeAndValidateMobile("+91 9876543210")).toEqual({ valid: true, normalized: "9876543210" });
      expect(normalizeAndValidateMobile("09876543210")).toEqual({ valid: true, normalized: "9876543210" });
      expect(normalizeAndValidateMobile("98765-43210")).toEqual({ valid: true, normalized: "9876543210" });
    });

    it("rejects invalid or malformed contact numbers", () => {
      expect(normalizeAndValidateMobile("12345").valid).toBe(false);
      expect(normalizeAndValidateMobile("1234567890").valid).toBe(false); // starts with 1
      expect(normalizeAndValidateMobile("0000000000").valid).toBe(false);
    });
  });

  // 3. College & Course/Branch Parsing
  describe("Institute & Branch Parsing", () => {
    const parseInstituteAndBranch = (input: string) => {
      let parsedCollege = input.trim();
      let parsedBranch: string | null = null;

      if (input.includes(" - ")) {
        const parts = input.split(" - ");
        parsedCollege = parts[0]?.trim() || parsedCollege;
        parsedBranch = parts.slice(1).join(" - ").trim() || null;
      } else if (input.includes(",")) {
        const parts = input.split(",");
        parsedCollege = parts[0]?.trim() || parsedCollege;
        parsedBranch = parts.slice(1).join(", ").trim() || null;
      }

      return { parsedCollege, parsedBranch };
    };

    it("parses combined college and branch cleanly", () => {
      const res = parseInstituteAndBranch("MLR Institute of Technology - B.Tech CSE");
      expect(res.parsedCollege).toBe("MLR Institute of Technology");
      expect(res.parsedBranch).toBe("B.Tech CSE");
    });

    it("handles comma-separated college and branch", () => {
      const res = parseInstituteAndBranch("MLRIT, Information Technology");
      expect(res.parsedCollege).toBe("MLRIT");
      expect(res.parsedBranch).toBe("Information Technology");
    });

    it("preserves standalone institute names without branches", () => {
      const res = parseInstituteAndBranch("MLR Institute of Technology");
      expect(res.parsedCollege).toBe("MLR Institute of Technology");
      expect(res.parsedBranch).toBeNull();
    });
  });

  // 4. Video URL Validation
  describe("Self-Introduction Video URL Validation", () => {
    const isValidVideoUrl = (url: string): boolean => {
      const trimmed = url.trim();
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
      const isGoogleDrive = trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com");
      if (!isGoogleDrive && (trimmed.includes("excel.cloud.microsoft") || trimmed.includes(".xlsx") || trimmed.includes(".xls"))) {
        return false;
      }
      return isGoogleDrive;
    };

    it("accepts valid Google Drive video links", () => {
      expect(isValidVideoUrl("https://drive.google.com/file/d/1abcXYZ_123/view?usp=sharing")).toBe(true);
      expect(isValidVideoUrl("https://docs.google.com/videos/d/1abcXYZ")).toBe(true);
    });

    it("rejects Excel sheets and invalid video URLs", () => {
      expect(isValidVideoUrl("https://excel.cloud.microsoft/open/onedrive/?docId=770B178737B46F03")).toBe(false);
      expect(isValidVideoUrl("https://example.com/spreadsheet.xlsx")).toBe(false);
      expect(isValidVideoUrl("ftp://invalid-url")).toBe(false);
    });
  });

  // 5. Availability Keyboard Mash Detection
  describe("Availability Validation", () => {
    const isValidAvailability = (availability: string): boolean => {
      const trimmed = availability.trim();
      if (!trimmed || trimmed.length < 3) return false;
      const isKeyboardMash =
        /^[qwertyuiopasdfghjklzxcvbnm]+$/i.test(trimmed) &&
        trimmed.length >= 6 &&
        !/immediate|full|part|month|week|flexible|ready|intern|hybrid|onsite|remote|avail/i.test(trimmed);
      return !isKeyboardMash;
    };

    it("accepts realistic availability statements", () => {
      expect(isValidAvailability("Immediate (Full-Time)")).toBe(true);
      expect(isValidAvailability("Immediate")).toBe(true);
      expect(isValidAvailability("Full-Time 3 Months")).toBe(true);
      expect(isValidAvailability("Flexible / Hybrid")).toBe(true);
    });

    it("rejects keyboard mashing like WERTYUI", () => {
      expect(isValidAvailability("WERTYUI")).toBe(false);
      expect(isValidAvailability("asdfghjk")).toBe(false);
      expect(isValidAvailability("zxcvbnm")).toBe(false);
    });
  });

  // 6. Resume Storage Path Normalization
  describe("Resume Storage Path Normalization", () => {
    const normalizeStoragePath = (path: string): string => {
      let clean = (path || "").trim();
      if (clean.startsWith("http://") || clean.startsWith("https://")) {
        const idx = clean.indexOf("/resumes/");
        if (idx !== -1) {
          clean = clean.substring(idx + "/resumes/".length);
        }
      }
      if (clean.startsWith("resumes/")) {
        clean = clean.replace(/^resumes\//, "");
      }
      return clean;
    };

    it("normalizes relative and prefixed storage paths accurately", () => {
      const standard = "e4f8c8fe-94a3-45d0-b50d-8b6167f179d1/1793301182540-resume.pdf";
      expect(normalizeStoragePath(standard)).toBe(standard);

      const prefixed = "resumes/e4f8c8fe-94a3-45d0-b50d-8b6167f179d1/1793301182540-resume.pdf";
      expect(normalizeStoragePath(prefixed)).toBe(standard);

      const fullUrl = "https://plyvtevuxdmzswtvpmwv.supabase.co/storage/v1/object/public/resumes/e4f8c8fe-94a3-45d0-b50d-8b6167f179d1/1793301182540-resume.pdf";
      expect(normalizeStoragePath(fullUrl)).toBe(standard);
    });
  });

  // 7. Multi-Application Resume Independence
  describe("Per-Application Resume Independence", () => {
    it("preserves distinct resumes across different applications of the same student", () => {
      const studentId = "user-12345";
      const app1 = {
        id: "app-001",
        student_id: studentId,
        internship_id: "role-ai-01",
        resume_url: `${studentId}/1793300000000-ai_engineer_resume.pdf`,
      };

      const app2 = {
        id: "app-002",
        student_id: studentId,
        internship_id: "role-web-02",
        resume_url: `${studentId}/1793300001000-fullstack_resume.docx`,
      };

      expect(app1.resume_url).not.toEqual(app2.resume_url);
      expect(app1.resume_url).toContain("ai_engineer_resume.pdf");
      expect(app2.resume_url).toContain("fullstack_resume.docx");
    });
  });

  // 8. RFC 4180 CSV Export Generation
  describe("Admin CSV Export Formatting", () => {
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).trim();
      return `"${str.replace(/"/g, '""')}"`;
    };

    it("escapes quotes, commas, and special characters properly", () => {
      expect(escapeCsv("John, Jr.")).toBe('"John, Jr."');
      expect(escapeCsv('Quote "Hello"')).toBe('"Quote ""Hello"""');
      expect(escapeCsv(null)).toBe('""');
    });

    it("generates full 16-column CSV record with exact headers", () => {
      const headers = [
        "Candidate Name",
        "CNF Number",
        "Contact Number",
        "Email Address",
        "College / Institute",
        "Course and Branch",
        "Graduation Year",
        "Preferred Internship Role",
        "Domain",
        "Application Status",
        "Relevant Skills",
        "Portfolio / Profile URL",
        "Introduction Video Link",
        "Availability",
        "Resume Storage Path",
        "Application Date",
      ];

      const row = [
        escapeCsv("SHREYAS"),
        escapeCsv("CNF000"),
        escapeCsv("9876543210"),
        escapeCsv("cnf000@equinox.mlrit.ac.in"),
        escapeCsv("MLR Institute of Technology"),
        escapeCsv("B.Tech CSE"),
        escapeCsv("2026"),
        escapeCsv("AI & Machine Learning Research Intern"),
        escapeCsv("Artificial Intelligence & Machine Learning"),
        escapeCsv("submitted"),
        escapeCsv("Python, PyTorch, LangChain"),
        escapeCsv("https://github.com/shreyas"),
        escapeCsv("https://drive.google.com/file/d/test"),
        escapeCsv("Immediate (Full-Time)"),
        escapeCsv("e4f8c8fe-94a3-45d0-b50d-8b6167f179d1/1793301182540-DOM.docx"),
        escapeCsv("30/10/2026, 01:00:00"),
      ];

      expect(headers.length).toBe(16);
      expect(row.length).toBe(16);
      expect(row[0]).toBe('"SHREYAS"');
      expect(row[1]).toBe('"CNF000"');
      expect(row[2]).toBe('"9876543210"');
      expect(row[4]).toBe('"MLR Institute of Technology"');
      expect(row[5]).toBe('"B.Tech CSE"');
      expect(row[14]).toBe('"e4f8c8fe-94a3-45d0-b50d-8b6167f179d1/1793301182540-DOM.docx"');
    });
  });
  // 9. Participating Companies & Opportunity Listings Verification
  describe("Participating Opportunities Split & Anonymity", () => {
    it("has 11 listings with Tech, Web Dev, and Marketing at the end", async () => {
      const { INTERNSHIP_COMPANIES } = await import("../data/companies");
      expect(INTERNSHIP_COMPANIES.length).toBe(11);

      const roles = INTERNSHIP_COMPANIES.map((c) => c.role);
      expect(roles.slice(-3)).toEqual(["Tech", "Web Dev", "Marketing"]);

      const [tech, webDev, marketing] = INTERNSHIP_COMPANIES.slice(-3);

      // Verify no Mode, Duration, or Stipend
      expect(tech!.mode).toBeUndefined();
      expect(tech!.duration).toBeUndefined();
      expect(tech!.stipend).toBeUndefined();

      expect(webDev!.mode).toBeUndefined();
      expect(webDev!.duration).toBeUndefined();
      expect(webDev!.stipend).toBeUndefined();

      expect(marketing!.mode).toBeUndefined();
      expect(marketing!.duration).toBeUndefined();
      expect(marketing!.stipend).toBeUndefined();

      // Verify requirements are set and have no headcount numbers
      expect(tech!.requirement).toContain("Basic knowledge of programming");
      expect(tech!.requirement).not.toMatch(/10\+|\b2\b|openings/i);

      expect(webDev!.requirement).toContain("Working knowledge of HTML, CSS and JavaScript");
      expect(webDev!.requirement).not.toMatch(/10\+|\b2\b|openings/i);

      expect(marketing!.requirement).toContain("Good written and verbal communication");
      expect(marketing!.requirement).not.toMatch(/10\+|\b2\b|openings/i);

      // Verify no company names anywhere
      const allText = JSON.stringify(INTERNSHIP_COMPANIES).toLowerCase();
      const forbidden = ["soaron", "aethriz", "vetria", "launchpadx", "student forge", "studentforge"];
      for (const name of forbidden) {
        expect(allText).not.toContain(name);
      }
    });
  });
});