import { describe, it, expect } from "vitest";
import {
  loginAdminCore,
  adminGetConfirmedStudentsCore,
  adminGetApplicationsCore,
  adminExportStudentsCsvCore,
  adminExportApplicationsCsvCore,
  getAuthorizedAdminClient,
  resolveResumeFile,
} from "@/lib/server-auth";

describe("Admin Portal Integration Test Suite", () => {
  let adminToken: string;

  it("authenticates admin user EQUINOXCIE and returns valid token", async () => {
    const res = await loginAdminCore({
      username: "EQUINOXCIE",
      password: "EQUINOXCIE",
    });

    expect(res).toBeDefined();
    expect(res.user?.id).toBeTruthy();
    expect(res.token).toBeTruthy();
    adminToken = res.token;
  });

  it("rejects unauthorized admin login attempts", async () => {
    await expect(
      loginAdminCore({
        username: "WRONG_ADMIN",
        password: "EQUINOXCIE",
      })
    ).rejects.toThrow(/invalid/i);

    await expect(
      loginAdminCore({
        username: "EQUINOXCIE",
        password: "WrongPassword999!",
      })
    ).rejects.toThrow(/invalid/i);
  });

  it("obtains authorized admin client and verifies role", async () => {
    const { client, adminUserId } = await getAuthorizedAdminClient(adminToken);
    expect(adminUserId).toBeTruthy();

    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", adminUserId)
      .single();

    expect(profile?.role).toBe("admin");
  });

  it("fetches registered students and returns non-empty real database records", async () => {
    const res = await adminGetConfirmedStudentsCore({ adminToken });

    expect(res).toBeDefined();
    expect(Array.isArray(res.dbStudents)).toBe(true);
    expect(res.dbStudents.length).toBeGreaterThan(0);

    const first = res.dbStudents[0];
    expect(first).toHaveProperty("full_name");
    expect(first).toHaveProperty("cnf_number");
    expect(first).toHaveProperty("is_premium_pass");
    expect(first).toHaveProperty("college");
  });

  it("fetches applications with joined student and internship details without merging", async () => {
    const apps = await adminGetApplicationsCore({ adminToken });

    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBeGreaterThan(0);

    apps.forEach((app: any) => {
      expect(app).toHaveProperty("id");
      expect(app).toHaveProperty("student_id");
      expect(app).toHaveProperty("internship_id");
      expect(app).toHaveProperty("internship");
      expect(app).toHaveProperty("student");
      expect(app.student).toHaveProperty("full_name");
      expect(app.student).toHaveProperty("team_code");
    });
  });

  it("resolves resume file from storage safely", async () => {
    const { client } = await getAuthorizedAdminClient(adminToken);
    const resolved = await resolveResumeFile(
      client,
      "960505b6-6bb1-4f40-b385-485ffbfde7e8"
    );

    expect(resolved.exists).toBe(true);
    expect(resolved.resolvedPath).toBeTruthy();
    expect(resolved.signedUrl).toBeTruthy();
  });

  it("returns exists: false for non-existent resume path without fabricating URL", async () => {
    const { client } = await getAuthorizedAdminClient(adminToken);
    const resolved = await resolveResumeFile(
      client,
      "00000000-0000-0000-0000-000000000000/non-existent-resume.pdf"
    );

    expect(resolved.exists).toBe(false);
    expect(resolved.signedUrl).toBeNull();
  });

  it("exports registered students to valid CSV string", async () => {
    const csvRes = await adminExportStudentsCsvCore({ adminToken });

    expect(csvRes).toBeDefined();
    expect(csvRes.count).toBeGreaterThan(0);
    expect(csvRes.csvContent).toContain("Candidate Name");
    expect(csvRes.csvContent).toContain("CNF Number");
    expect(csvRes.filename).toContain("equinox_registered_students_");
  });

  it("exports applications to valid CSV string with all details", async () => {
    const csvRes = await adminExportApplicationsCsvCore({ adminToken });

    expect(csvRes).toBeDefined();
    expect(csvRes.count).toBeGreaterThan(0);
    expect(csvRes.csvContent).toContain("Candidate Name");
    expect(csvRes.csvContent).toContain("Preferred Internship Role");
    expect(csvRes.filename).toContain("equinox_internship_applications_");
  });
});
