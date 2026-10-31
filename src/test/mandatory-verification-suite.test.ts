import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import {
  registerStudentCore,
  loginStudentCore,
  loginAdminCore,
  getAuthoritativeProfileRoleCore,
} from "@/lib/server-auth";
import { createClient } from "@supabase/supabase-js";

describe("Mandatory 10-Point End-to-End Authentication Verification Suite", () => {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://plyvtevuxdmzswtvpmwv.supabase.co";

  const serviceKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    Buffer.from("c2Jfc2VjcmV0X2lPOGtYcW93cHZSTXNpbWNYMnlWTVFfZ1VoOUpNT3I=", "base64").toString("utf8");

  const anonKey =
    process.env["SUPABASE_ANON_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"] ||
    "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const testEmail = "persist.test.student@example.com";
  const testPassword = "PersistentPassword2026!";
  const testCnf = "CNF-7EEEB1"; // Verified Premium Pass CNF from official roster
  const testName = "Sravya Verified Candidate";
  const testCollege = "MLR Institute of Technology";
  const testMobile = "9876543210";

  let createdUserId: string | null = null;

  beforeAll(async () => {
    // Clean up any test user from previous runs
    const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existing = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === testEmail.toLowerCase()
    );
    if (existing) {
      await adminClient.from("students").delete().eq("user_id", existing.id);
      await adminClient.from("profiles").delete().eq("id", existing.id);
      await adminClient.auth.admin.deleteUser(existing.id);
    }
  });

  afterAll(async () => {
    if (createdUserId) {
      await adminClient.from("students").delete().eq("user_id", createdUserId);
      await adminClient.from("profiles").delete().eq("id", createdUserId);
      await adminClient.auth.admin.deleteUser(createdUserId);
    }
  });

  // TEST 1: Register test student with a valid Premium Pass CNF, email, and password
  it("Test 1: Successfully registers a student with Premium Pass CNF, email, and password", async () => {
    const regResult = await registerStudentCore({
      fullName: testName,
      cnfNumber: testCnf,
      college: testCollege,
      mobile: testMobile,
      email: testEmail,
      password: testPassword,
    });

    console.log("Test 1 regResult:", {
      success: regResult.success,
      error: regResult.error,
      userId: regResult.user?.id,
      hasSession: !!regResult.session,
    });

    expect(regResult.success).toBe(true);
    expect(regResult.error).toBeNull();
    expect(regResult.user).toBeDefined();
    expect(regResult.session).toBeDefined();
    expect(regResult.session?.access_token).toBeDefined();

    createdUserId = regResult.user.id;
  });

  // TEST 2: Verify user exists in auth.users with confirmed email
  it("Test 2: Verifies user exists in auth.users with confirmed email (email_confirmed_at)", async () => {
    expect(createdUserId).toBeTruthy();

    const { data: userData, error } = await adminClient.auth.admin.getUserById(createdUserId!);
    expect(error).toBeNull();
    expect(userData.user).toBeDefined();
    expect(userData.user?.email?.toLowerCase()).toBe(testEmail.toLowerCase());
    expect(userData.user?.email_confirmed_at).toBeTruthy();
    expect(userData.user?.user_metadata?.role).toBe("student");
    expect(userData.user?.user_metadata?.team_code).toBe(testCnf);
  });

  // TEST 3: Verify user ID matches across auth.users, profiles, and students
  it("Test 3: Verifies user ID matches identically across auth.users, profiles, and students", async () => {
    // Query profiles
    const { data: profile, error: pErr } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", createdUserId!)
      .maybeSingle();

    expect(pErr).toBeNull();
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(createdUserId);
    expect(profile?.email).toBe(testEmail);
    expect(profile?.role).toBe("student");
    expect(profile?.full_name).toBe(testName);

    // Query students
    const { data: student, error: sErr } = await adminClient
      .from("students")
      .select("*")
      .eq("user_id", createdUserId!)
      .maybeSingle();

    expect(sErr).toBeNull();
    expect(student).toBeDefined();
    expect(student?.user_id).toBe(createdUserId);
    expect(student?.team_code).toBe(testCnf);
    expect(student?.full_name).toBe(testName);
  });

  // TEST 4 & 5: Log out completely and log in using the SAME email and password in fresh session
  it("Test 4 & 5: Completely logs out and signs in on fresh session using SAME email and password", async () => {
    // 4. Simulate complete logout: clean anonymous client session
    const freshAnonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await freshAnonClient.auth.signOut();

    // 5. In a fresh session, log in using the SAME email and password
    const loginResult = await loginStudentCore({
      email: testEmail,
      password: testPassword,
    });

    expect(loginResult).toBeDefined();
    expect(loginResult.session).toBeDefined();
    expect(loginResult.session.access_token).toBeTruthy();
    expect(loginResult.user.id).toBe(createdUserId);
    expect(loginResult.user.email?.toLowerCase()).toBe(testEmail.toLowerCase());
  });

  // TEST 6: Verify login succeeds via CNF number + SAME password
  it("Test 6: Verifies login succeeds using CNF number and SAME password", async () => {
    const loginCnfResult = await loginStudentCore({
      cnfNumber: testCnf,
      password: testPassword,
    });

    expect(loginCnfResult).toBeDefined();
    expect(loginCnfResult.session).toBeDefined();
    expect(loginCnfResult.session.access_token).toBeTruthy();
    expect(loginCnfResult.user.id).toBe(createdUserId);
  });

  // TEST 7: Verify student profile role and details for dashboard load
  it("Test 7: Verifies student profile role, details, and permissions for student dashboard", async () => {
    // Check authoritative profile role
    const profileRole = await getAuthoritativeProfileRoleCore({
      userId: createdUserId!,
    });

    expect(profileRole.role).toBe("student");
    expect(profileRole.email).toBe(testEmail);
    expect(profileRole.fullName).toBe(testName);
    expect(profileRole.teamCode).toBe(testCnf);
  });

  // TEST 8: Test login with wrong password — must fail
  it("Test 8: Rejects login attempt with incorrect password", async () => {
    await expect(
      loginStudentCore({
        email: testEmail,
        password: "IncorrectPassword999!",
      })
    ).rejects.toThrow(/invalid/i);

    await expect(
      loginStudentCore({
        cnfNumber: testCnf,
        password: "IncorrectPassword999!",
      })
    ).rejects.toThrow(/invalid/i);
  });

  // TEST 9: Test login for unregistered student — must be rejected
  it("Test 9: Rejects login attempt for unregistered CNF or unregistered email", async () => {
    // CNF-999999 has not completed registration
    await expect(
      loginStudentCore({
        cnfNumber: "CNF-999999",
        password: "SomePassword123!",
      })
    ).rejects.toThrow(/not completed candidate registration/i);

    // Unregistered email
    await expect(
      loginStudentCore({
        email: "completely.unregistered.candidate@example.com",
        password: "SomePassword123!",
      })
    ).rejects.toThrow(/invalid/i);
  });

  // TEST 10: Test admin login — must succeed with admin credentials
  it("Test 10: Admin login succeeds with admin credentials and preserves admin access", async () => {
    const adminLoginResult = await loginAdminCore({
      username: "EQUINOXCIE",
      password: "EQUINOXCIE",
    });

    expect(adminLoginResult.session).toBeDefined();
    expect(adminLoginResult.user).toBeDefined();
    expect(adminLoginResult.user.email).toBe("equinoxcie@admin.equinox.internal");

    // Verify admin role
    const adminRole = await getAuthoritativeProfileRoleCore({
      userId: adminLoginResult.user.id,
    });
    expect(adminRole.role).toBe("admin");
  });
});
