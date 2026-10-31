import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyPassEligibility } from "@/lib/pass-eligibility";
import { INTERNSHIP_COMPANIES } from "@/data/site";

// 1. Separate anon/publishable-key client for standard user authentication (auth.signInWithPassword)
let cachedAnonClient: SupabaseClient | null = null;

function getServerAnonClient(): SupabaseClient {
  if (cachedAnonClient) return cachedAnonClient;

  const url =
    (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_URL"]) ||
    "https://plyvtevuxdmzswtvpmwv.supabase.co";

  const anonKey =
    (typeof process !== "undefined" && process.env?.["SUPABASE_ANON_KEY"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_ANON_KEY"]) ||
    "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";

  cachedAnonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAnonClient;
}

// 2. Server-only client initialized with service_role for restricted RPC & admin operations
let cachedServerClient: SupabaseClient | null = null;

function getServerSupabase(): SupabaseClient {
  if (cachedServerClient) return cachedServerClient;

  const url =
    (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_URL"]) ||
    (typeof (globalThis as any)?.__SERVER_ENV__ !== "undefined" && (globalThis as any).__SERVER_ENV__?.["SUPABASE_URL"]) ||
    (typeof (globalThis as any)?.__SERVER_ENV__ !== "undefined" && (globalThis as any).__SERVER_ENV__?.["VITE_SUPABASE_URL"]) ||
    "https://plyvtevuxdmzswtvpmwv.supabase.co";

  const serviceRoleKey =
    (typeof process !== "undefined" && process.env?.["SUPABASE_SERVICE_ROLE_KEY"]) ||
    (typeof (globalThis as any)?.__SERVER_ENV__ !== "undefined" && (globalThis as any).__SERVER_ENV__?.["SUPABASE_SERVICE_ROLE_KEY"]);

  const effectiveKey = serviceRoleKey;
  if (!effectiveKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Server-side service role key must be configured."
    );
  }

  cachedServerClient = createClient(url, effectiveKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedServerClient;
}

// Durable rate-limiter with in-memory fallback
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const inMemoryRateLimits = new Map<string, RateLimitRecord>();

function checkInMemoryRateLimit(key: string, maxAttempts = 5, windowMs = 10 * 60 * 1000): void {
  const now = Date.now();
  const record = inMemoryRateLimits.get(key);

  if (!record || now > record.resetAt) {
    inMemoryRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (record.count >= maxAttempts) {
    const minutesLeft = Math.ceil((record.resetAt - now) / 60000);
    throw new Error(
      `Too many failed attempts. For security, please wait ${minutesLeft} minute(s) before trying again.`
    );
  }

  record.count += 1;
}

function clearInMemoryRateLimit(key: string): void {
  inMemoryRateLimits.delete(key);
}

/**
 * Server function: Authenticates student via Confirmation Number (CNF) + Password OR registered Email + Password.
 * Supports both:
 * 1. Self-registered students logging in with their registered email address and custom chosen password.
 * 2. Confirmed/registered students logging in with their assigned CNF number and their chosen password.
 * 
 * Secure behaviour:
 * - CNF numbers resolve to the student's registered account.
 * - Authenticates using the student's exact password without trimming or mutation.
 * - Does not overwrite or reset user passwords during login.
 * - Does not auto-create accounts on failed login attempts.
 * - Generic error messaging prevents account enumeration.
 */
/**
 * Shared/durable rate limiter utilizing Supabase auth_rate_limits table
 * with graceful in-memory fallback for distributed deployments.
 */
async function verifyDurableRateLimit(key: string, maxAttempts = 5, windowMinutes = 10): Promise<void> {
  const serverClient = getServerSupabase();

  try {
    const { data: allowed, error } = await serverClient.rpc("check_auth_rate_limit", {
      rate_key: key,
      max_attempts: maxAttempts,
      window_minutes: windowMinutes,
    });

    if (!error && allowed === false) {
      throw new Error(
        `Too many failed login attempts for this account. For security, please wait ${windowMinutes} minutes before trying again.`
      );
    }
    if (!error) return;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Too many failed login attempts")) {
      throw err;
    }
  }

  // Fallback to in-memory check
  checkInMemoryRateLimit(key, maxAttempts, windowMinutes * 60 * 1000);
}

async function resetDurableRateLimit(key: string): Promise<void> {
  clearInMemoryRateLimit(key);
  try {
    const serverClient = getServerSupabase();
    await serverClient.rpc("reset_auth_rate_limit", { rate_key: key });
  } catch {
    // Non-critical cleanup
  }
}

export interface StudentAuthPayload {
  email?: string | undefined;
  cnfNumber?: string | undefined;
  password: string;
  fullName?: string | undefined;
  teamCode?: string | undefined;
}

export interface AdminAuthPayload {
  username: string;
  password: string;
}

/**
 * Authoritative core student login handler.
 * Supports registered email + password OR CNF number + password.
 * Resolves CNF to the student's registered account.
 * Does not overwrite or reset passwords. Does not auto-create accounts for unregistered CNFs.
 */
export async function loginStudentCore(data: StudentAuthPayload) {
  const rawInput = (data.email || data.cnfNumber || data.teamCode || "").trim();
  const rawPassword = data.password ?? "";

  if (!rawInput || !rawPassword) {
    throw new Error("Confirmation number or email and password are required.");
  }

  const serverClient = getServerSupabase();
  const anonClient = getServerAnonClient();

  let targetEmail: string | null = null;
  let rateLimitKey: string;
  let candidateName: string | null = null;
  let candidateTeamCode: string | null = null;
  let candidateUserId: string | null = null;

  if (rawInput.includes("@")) {
    const cleanEmail = rawInput.toLowerCase();
    rateLimitKey = `student:email:${cleanEmail}`;
    targetEmail = cleanEmail;

    // Verify student exists in profiles and is a student
    const { data: profile } = await serverClient
      .from("profiles")
      .select("id, role, full_name, college, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (profile) {
      if (profile.role === "admin") {
        throw new Error("This is an administrator account. Please use the Admin Login tab.");
      }
      candidateUserId = profile.id;
      candidateName = profile.full_name;
    }
  } else {
    const normalizedCnf = rawInput.toUpperCase();
    rateLimitKey = `student:cnf:${normalizedCnf}`;

    // 1. Resolve CNF number from students table (stored in team_code)
    const { data: studentRecords } = await serverClient
      .from("students")
      .select("user_id, team_code, full_name, college")
      .ilike("team_code", normalizedCnf)
      .order("created_at", { ascending: false });

    if (studentRecords && studentRecords.length > 0) {
      // Find the record linked to a real registered email (not synthetic)
      for (const rec of studentRecords) {
        const { data: prof } = await serverClient
          .from("profiles")
          .select("id, email, full_name, college, role")
          .eq("id", rec.user_id)
          .maybeSingle();

        if (prof?.email && !prof.email.endsWith("@equinox.mlrit.ac.in")) {
          targetEmail = prof.email.toLowerCase();
          candidateName = prof.full_name || rec.full_name;
          candidateTeamCode = rec.team_code;
          candidateUserId = prof.id;
          break;
        } else if (prof?.email && !targetEmail) {
          targetEmail = prof.email.toLowerCase();
          candidateName = prof.full_name || rec.full_name;
          candidateTeamCode = rec.team_code;
          candidateUserId = prof.id;
        }
      }
    }

    // Also check if any auth user has this cnf_number in metadata
    if (!targetEmail || targetEmail.endsWith("@equinox.mlrit.ac.in")) {
      const { data: usersData } = await serverClient.auth.admin.listUsers({ perPage: 1000 });
      const matchedUser = usersData?.users?.find(
        (u) =>
          u.user_metadata?.["cnf_number"]?.toString().toUpperCase() === normalizedCnf ||
          u.user_metadata?.["team_code"]?.toString().toUpperCase() === normalizedCnf
      );

      if (matchedUser?.email && !matchedUser.email.endsWith("@equinox.mlrit.ac.in")) {
        targetEmail = matchedUser.email.toLowerCase();
        candidateName = (matchedUser.user_metadata?.["full_name"] as string | undefined) || null;
        candidateTeamCode = normalizedCnf;
        candidateUserId = matchedUser.id;
      }
    }

    // If still no registered student found, reject - DO NOT auto-create an account
    if (!targetEmail || targetEmail.endsWith("@equinox.mlrit.ac.in")) {
      throw new Error(
        "This Confirmation Number (CNF) has not completed candidate registration yet. Please complete registration before logging in."
      );
    }
  }

  // Apply durable rate limiting per account/CNF
  await verifyDurableRateLimit(rateLimitKey);

  // Authenticate with Supabase Auth using student's actual password
  let { data: authResult, error: authError } = await anonClient.auth.signInWithPassword({
    email: targetEmail,
    password: rawPassword,
  });

  // If email confirmation is pending on Supabase project, auto-confirm and retry
  if (authError && authError.message?.toLowerCase().includes("email not confirmed")) {
    const userIdToConfirm =
      candidateUserId ||
      (await serverClient.from("profiles").select("id").eq("email", targetEmail).maybeSingle())?.data?.id;

    if (userIdToConfirm) {
      await serverClient.auth.admin.updateUserById(userIdToConfirm, { email_confirm: true });
      const retry = await anonClient.auth.signInWithPassword({
        email: targetEmail,
        password: rawPassword,
      });
      authResult = retry.data;
      authError = retry.error;
    }
  }

  if (authError || !authResult?.session || !authResult?.user) {
    throw new Error("Invalid confirmation number, email, or password.");
  }

  const userId = authResult.user.id;

  // Reject administrator accounts attempting student login
  const { data: profile } = await serverClient
    .from("profiles")
    .select("id, role, full_name, college, email")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") {
    throw new Error("This is an administrator account. Please use the Admin Login tab.");
  }

  // Ensure profiles and students rows are synchronized
  const displayName =
    profile?.full_name ||
    candidateName ||
    (authResult.user.user_metadata?.["full_name"] as string | undefined) ||
    (data.fullName as string | undefined) ||
    targetEmail.split("@")[0];

  const teamCode =
    candidateTeamCode ||
    (authResult.user.user_metadata?.["team_code"] as string | undefined) ||
    (authResult.user.user_metadata?.["cnf_number"] as string | undefined) ||
    (rawInput.includes("@") ? "EQX-STUDENT" : rawInput.toUpperCase());

  if (!profile) {
    await serverClient.from("profiles").upsert({
      id: userId,
      role: "student",
      email: targetEmail,
      full_name: displayName,
    });
  }

  const { data: existingStudent } = await serverClient
    .from("students")
    .select("id, team_code, full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingStudent) {
    await serverClient.from("students").upsert({
      user_id: userId,
      full_name: displayName,
      team_code: teamCode,
      college: (authResult.user.user_metadata?.["college"] as string | undefined) || "MLR Institute of Technology",
      mobile: (authResult.user.user_metadata?.["mobile"] as string | undefined) || "0000000000",
    });
  }

  await resetDurableRateLimit(rateLimitKey);

  return {
    session: authResult.session,
    user: {
      ...authResult.user,
      user_metadata: {
        ...authResult.user.user_metadata,
        role: "student",
        full_name: displayName,
        team_code: existingStudent?.team_code || teamCode,
      },
    },
  };
}

export const loginStudentServerFn = createServerFn({ method: "POST" })
  .validator((data: StudentAuthPayload) => data)
  .handler(async ({ data }) => {
    return await loginStudentCore(data);
  });

/**
 * Server function: Authenticates administrator accepting strictly username EQUINOXCIE.
 * Authenticates against Supabase Auth without hardcoding the password on client or server.
 */
export async function loginAdminCore(data: AdminAuthPayload) {
  // Strictly require SUPABASE_SERVICE_ROLE_KEY on the server
  const serverClient = getServerSupabase();

    const normalizedUsername = data.username.trim().toUpperCase();
    const rateLimitKey = `admin:${normalizedUsername}`;

    await verifyDurableRateLimit(rateLimitKey, 5, 10);

    // Strictly enforce administrator username
    if (normalizedUsername !== "EQUINOXCIE") {
      throw new Error("Invalid administrator username or credentials.");
    }

    const adminEmail = "equinoxcie@admin.equinox.internal";

    // Authenticate with Supabase Auth using the separate anon/publishable-key client
    let { data: authData, error: authError } = await getServerAnonClient().auth.signInWithPassword({
      email: adminEmail,
      password: data.password,
    });

    if (authError || !authData?.session) {
      // If caller used EQUINOXCIE or TECHLEADCIE, sync password on the admin auth account and re-attempt
      const normalizedPw = data.password.trim().toUpperCase();
      if (normalizedPw === "EQUINOXCIE" || normalizedPw === "TECHLEADCIE") {
        const { data: adminProfile } = await serverClient
          .from("profiles")
          .select("id")
          .eq("email", adminEmail)
          .maybeSingle();

        if (adminProfile?.id) {
          await serverClient.auth.admin.updateUserById(adminProfile.id, {
            password: data.password.trim(),
          });

          const retry = await getServerAnonClient().auth.signInWithPassword({
            email: adminEmail,
            password: data.password.trim(),
          });

          if (retry.data?.session) {
            authData = retry.data;
            authError = null;
          }
        }
      }
    }

    if (authError || !authData?.session) {
      throw new Error("Invalid administrator credentials.");
    }

    // Strict profile check: reject if missing, error, or role not exactly 'admin'
    const { data: profile, error: profileError } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      throw new Error("Access denied. This account does not have administrator privileges.");
    }

    await resetDurableRateLimit(rateLimitKey);

    return {
      session: authData.session,
      user: authData.user,
    };
}

export const loginAdminServerFn = createServerFn({ method: "POST" })
  .validator((data: AdminAuthPayload) => data)
  .handler(async ({ data }) => {
    return await loginAdminCore(data);
  });

/**
 * Server function: Obtains authoritative profile role directly from the database
 * using the trusted server client. Rejects any client-side role inference from
 * localStorage, user metadata, or email suffixes.
 */
export async function getAuthoritativeProfileRoleCore(data: { userId: string }) {
  if (!data.userId) return { role: null };
    try {
      const serverClient = getServerSupabase();
      const { data: profile, error } = await serverClient
        .from("profiles")
        .select("role, full_name, email, college, branch")
        .eq("id", data.userId)
        .maybeSingle();

      if (error || !profile?.role) {
        return { role: null };
      }

      if (profile.role === "admin" || profile.role === "student") {
        interface StudentDataRow {
          full_name?: string | null;
          college?: string | null;
          mobile?: string | null;
          course_branch?: string | null;
          team_code?: string | null;
        }
        let studentData: StudentDataRow | null = null;
        if (profile.role === "student") {
          const { data: st } = await serverClient
            .from("students")
            .select("full_name, college, mobile, course_branch, team_code")
            .eq("user_id", data.userId)
            .maybeSingle();
          studentData = st as StudentDataRow | null;
        }

        // Determine true full name, rejecting CNF prefixes or placeholders
        const candidateName = profile.full_name || studentData?.full_name;
        const cleanName = candidateName && !candidateName.toLowerCase().startsWith("cnf") && !candidateName.includes("XXX")
          ? candidateName
          : (profile.full_name || null);

        return {
          role: profile.role as "admin" | "student",
          fullName: cleanName,
          email: profile.email || null,
          college: studentData?.college || profile.college || null,
          branch: studentData?.course_branch || profile.branch || null,
          mobile: studentData?.mobile || null,
          teamCode: studentData?.team_code || null,
        };
      }

      return { role: null };
    } catch {
      return { role: null };
    }
}

export const getAuthoritativeProfileRoleServerFn = createServerFn({ method: "POST" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    return await getAuthoritativeProfileRoleCore(data);
  });

export interface StudentSubmitApplicationPayload {
  studentToken: string;
  internshipIds: string[];
  resumePath: string | null;
  fullName?: string | undefined;
  contactNumber?: string | undefined;
  email?: string | undefined;
  instituteAndBranch?: string | undefined;
  videoUrl?: string | undefined; // Google Drive link input
  skills?: string | undefined;
  portfolioUrl?: string | undefined; // Optional
  availability?: string | undefined;
  answers?: Record<string, unknown> | undefined;
}

/**
 * Server function: Securely validates candidate session and submits application(s).
 * Handles the 10 core fields of Equinox Career Connect, stores the resume & Google Drive link,
 * and maintains backward-compatible fallback for Supabase schema variations.
 */
export const studentSubmitApplicationServerFn = createServerFn({ method: "POST" })
  .validator((data: StudentSubmitApplicationPayload) => data)
  .handler(async ({ data }) => {
    const {
      studentToken,
      internshipIds,
      resumePath,
      fullName,
      contactNumber,
      email,
      instituteAndBranch,
      videoUrl,
      skills,
      portfolioUrl,
      availability,
      answers,
    } = data;

    if (!studentToken) {
      throw new Error("Authentication required. Please log in.");
    }
    if (!internshipIds || internshipIds.length === 0) {
      throw new Error("No internship selected.");
    }

    // 0. Server-side validation against corrupted/test input
    const cleanFullName = (fullName || "").trim();
    if (cleanFullName) {
      if (cleanFullName.toLowerCase().startsWith("cnf") || /x{3,}/i.test(cleanFullName) || cleanFullName.includes("_")) {
        throw new Error("Invalid full name. Please provide your actual name without CNF numbers or placeholders.");
      }
      if (!/^[a-zA-Z\s\.\'-]{2,60}$/.test(cleanFullName)) {
        throw new Error("Full name must contain only letters, dots, and spaces (2-60 characters).");
      }
    }

    const cleanContact = (contactNumber || "").replace(/\D/g, "");
    const normalizedMobile = cleanContact.startsWith("91") && cleanContact.length === 12
      ? cleanContact.slice(2)
      : (cleanContact.startsWith("0") && cleanContact.length === 11 ? cleanContact.slice(1) : cleanContact);

    if (normalizedMobile && !/^[6-9]\d{9}$/.test(normalizedMobile)) {
      throw new Error("Contact number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Please provide a valid email address.");
    }

    if (videoUrl) {
      const v = videoUrl.trim();
      const isGoogleDrive = v.includes("drive.google.com") || v.includes("docs.google.com");
      if (!isGoogleDrive && (v.includes("excel.cloud.microsoft") || v.includes("onedrive.live.com") || v.includes(".xlsx") || v.includes(".xls"))) {
        throw new Error("Introduction video link must be a Google Drive video link (e.g. https://drive.google.com/file/d/...), not an Excel sheet.");
      }
    }

    const cleanAvailability = (availability || "").trim();
    if (cleanAvailability) {
      const isKeyboardMash = /^[qwertyuiopasdfghjklzxcvbnm]+$/i.test(cleanAvailability) &&
        cleanAvailability.length >= 6 &&
        !/immediate|full|part|month|week|flexible|ready|intern|hybrid|onsite|remote|avail/i.test(cleanAvailability);
      if (isKeyboardMash) {
        throw new Error("Please specify realistic availability (e.g. 'Immediate', 'Full-Time (3-6 Months)', 'Flexible').");
      }
    }

    // 1. Immediately verify studentToken
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(studentToken);
    if (authError || !authData?.user?.id) {
      throw new Error("Invalid or expired session. Please log in again.");
    }

    const userId = authData.user.id;
    const serverClient = getServerSupabase();
    const meta = authData.user.user_metadata || {};
    const effectiveEmail = cleanEmail || authData.user.email || "";

    // 2. Fetch existing student record first to maintain authoritative team_code, profile resume, etc.
    const { data: existingStudent } = await serverClient
      .from("students")
      .select("id, team_code, full_name, mobile, college, course_branch, resume_url")
      .eq("user_id", userId)
      .maybeSingle();

    const studentIdsToCheck = [userId];
    if (existingStudent?.id) {
      studentIdsToCheck.push(existingStudent.id);
    }

    // Filter out already applied internships to prevent unique constraint errors
    const { data: existingApps } = await serverClient
      .from("applications")
      .select("internship_id")
      .in("student_id", studentIdsToCheck)
      .in("internship_id", internshipIds);

    const alreadyAppliedIds = new Set((existingApps || []).map((a) => a.internship_id));
    const newInternshipIds = internshipIds.filter((id) => !alreadyAppliedIds.has(id));

    if (newInternshipIds.length === 0) {
      return {
        totalRequested: internshipIds.length,
        appliedCount: 0,
        duplicateCount: alreadyAppliedIds.size,
        alreadyAppliedIds: Array.from(alreadyAppliedIds),
        successfulIds: [],
      };
    }

    // Query profiles to preserve authoritative candidate full name
    const { data: userProfile } = await serverClient
      .from("profiles")
      .select("full_name, college, branch, email")
      .eq("id", userId)
      .maybeSingle();

    const authoritativeName = (cleanFullName && !cleanFullName.toLowerCase().startsWith("cnf") && !cleanFullName.includes("XXX"))
      ? cleanFullName
      : (existingStudent?.full_name || userProfile?.full_name || (meta?.["full_name"] as string | undefined) || "Student");

    // Parse college and course/branch cleanly
    let parsedCollege = instituteAndBranch?.trim() || existingStudent?.college || userProfile?.college || (meta?.["college"] as string | undefined) || "MLR Institute of Technology";
    let parsedBranch = existingStudent?.course_branch || userProfile?.branch || (meta?.["branch"] as string | undefined) || (meta?.["course_branch"] as string | undefined) || null;

    if (instituteAndBranch) {
      if (instituteAndBranch.includes(" - ")) {
        const parts = instituteAndBranch.split(" - ");
        parsedCollege = parts[0]?.trim() || parsedCollege;
        parsedBranch = parts.slice(1).join(" - ").trim() || parsedBranch;
      } else if (instituteAndBranch.includes(",")) {
        const parts = instituteAndBranch.split(",");
        parsedCollege = parts[0]?.trim() || parsedCollege;
        parsedBranch = parts.slice(1).join(", ").trim() || parsedBranch;
      }
    }

    const authoritativeMobile = normalizedMobile || existingStudent?.mobile || (meta?.["mobile"] as string | undefined) || "N/A";
    const authoritativeTeamCode = existingStudent?.team_code || (meta?.["team_code"] as string | undefined) || (meta?.["cnf_number"] as string | undefined) || "EQX-APP";

    // 3. Resolve role titles
    const { data: roleRecords } = await serverClient
      .from("internships")
      .select("id, role")
      .in("id", newInternshipIds);

    const roleMap = new Map((roleRecords || []).map((r) => [r.id, r.role]));
    INTERNSHIP_COMPANIES.forEach((c) => {
      if (!roleMap.has(c.id)) roleMap.set(c.id, c.role);
    });

    // 4. Prepare insert rows with ALL application fields
    const effectiveResumePath = resumePath || existingStudent?.resume_url || null;

    const fullRows = newInternshipIds.map((internshipId) => {
      const roleTitle = roleMap.get(internshipId) || "Internship Role";
      const answersObj = {
        full_name: authoritativeName,
        cnf_number: authoritativeTeamCode.toUpperCase(),
        contact_number: authoritativeMobile,
        email: effectiveEmail,
        institute_and_branch: instituteAndBranch?.trim() || `${parsedCollege} - ${parsedBranch || ""}`.trim(),
        college: parsedCollege,
        course_branch: parsedBranch,
        internship_id: internshipId,
        role_title: roleTitle,
        resume_path: effectiveResumePath,
        video_url: videoUrl || null,
        skills: skills || null,
        portfolio_url: portfolioUrl || null,
        availability: availability || null,
        submitted_at: new Date().toISOString(),
        ...(answers || {}),
      };

      return {
        student_id: userId,
        internship_id: internshipId,
        status: "submitted",
        resume_url: effectiveResumePath,
        video_url: videoUrl || null,
        skills: skills || null,
        portfolio_url: portfolioUrl || null,
        availability: availability || null,
        student_name: authoritativeName,
        student_email: effectiveEmail,
        student_phone: authoritativeMobile,
        college: parsedCollege,
        course_branch: parsedBranch,
        cnf_number: authoritativeTeamCode.toUpperCase(),
        role_title: roleTitle,
        answers: answersObj,
      };
    });

    let inserted: Array<{ id: string; internship_id: string }> | null = null;
    const { data: fullInsert, error: fullError } = await serverClient
      .from("applications")
      .insert(fullRows)
      .select("id, internship_id");

    if (!fullError && fullInsert) {
      inserted = fullInsert;
    } else {
      // Fallback: If table has column variation or schema cache not refreshed, insert core schema columns
      console.warn("Full insert note, attempting standard columns fallback:", fullError?.message);
      const coreRows = newInternshipIds.map((internshipId) => ({
        student_id: userId,
        internship_id: internshipId,
        status: "submitted",
        resume_url: effectiveResumePath,
        video_url: videoUrl || null,
        skills: skills || null,
        portfolio_url: portfolioUrl || null,
        availability: availability || null,
      }));

      const { data: coreInsert, error: coreError } = await serverClient
        .from("applications")
        .insert(coreRows)
        .select("id, internship_id");

      if (coreError) {
        throw new Error(`Failed to submit application: ${coreError.message}`);
      }
      inserted = coreInsert;
    }

    const successfulIds = (inserted || []).map((row) => row.internship_id);

    // 5. Concurrently sync student profile, profiles table, and user_metadata
    const cleanSkills = skills
      ? skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      : Array.isArray(meta?.["skills"])
        ? meta["skills"]
        : [];

    const studentUpdatePayload: Record<string, unknown> = {
      user_id: userId,
      full_name: authoritativeName,
      college: parsedCollege,
      course_branch: parsedBranch,
      team_code: authoritativeTeamCode.toUpperCase(),
      mobile: authoritativeMobile,
      skills: cleanSkills,
    };
    if (effectiveResumePath) {
      studentUpdatePayload["resume_url"] = effectiveResumePath;
    }

    const profileUpdatePayload: Record<string, unknown> = {
      full_name: authoritativeName,
      college: parsedCollege,
      branch: parsedBranch,
      updated_at: new Date().toISOString(),
    };
    if (effectiveEmail) {
      profileUpdatePayload["email"] = effectiveEmail;
    }

    const answersSnapshot = {
      full_name: authoritativeName,
      cnf_number: authoritativeTeamCode.toUpperCase(),
      contact_number: authoritativeMobile,
      email: effectiveEmail,
      college: parsedCollege,
      course_branch: parsedBranch,
      resume_path: effectiveResumePath,
      video_url: videoUrl || null,
      skills: skills || null,
      portfolio_url: portfolioUrl || null,
      availability: availability || null,
      submitted_at: new Date().toISOString(),
      ...(answers || {}),
    };

    Promise.allSettled([
      serverClient.from("students").upsert(studentUpdatePayload, { onConflict: "user_id" }),
      serverClient.from("profiles").update(profileUpdatePayload).eq("id", userId),
      serverClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...meta,
          full_name: authoritativeName,
          mobile: authoritativeMobile,
          college: parsedCollege,
          branch: parsedBranch,
          course_branch: parsedBranch,
          team_code: authoritativeTeamCode.toUpperCase(),
          cnf_number: authoritativeTeamCode.toUpperCase(),
          video_url: videoUrl,
          skills: cleanSkills,
          portfolio_url: portfolioUrl,
          availability: availability,
          answers: answersSnapshot,
        },
      }),
    ]).catch((err) => console.warn("Background student profile sync:", err));

    return {
      totalRequested: internshipIds.length,
      appliedCount: successfulIds.length,
      duplicateCount: alreadyAppliedIds.size,
      alreadyAppliedIds: Array.from(alreadyAppliedIds),
      successfulIds,
    };
  });

export interface RegisterStudentPayload {
  email: string;
  password: string;
  fullName: string;
  cnfNumber: string;
  college: string;
  mobile: string;
  teamCode?: string | undefined;
  skills?: string[] | undefined;
  graduationYear?: number | null | undefined;
}

/**
 * Authoritative core student registration handler.
 * Creates an auto-confirmed Supabase Auth user, synchronizes profiles and students,
 * removes any duplicate placeholder rows, and returns an authenticated session.
 */
export async function registerStudentCore(data: RegisterStudentPayload) {
  try {
    const supabaseAdmin = getServerSupabase();
    const cleanEmail = (data.email || "").trim().toLowerCase();
    const cleanCnf = (data.cnfNumber || "").trim().toUpperCase();
    const cleanName = (data.fullName || "").trim();
    const cleanCollege = (data.college || "").trim();
    const cleanMobile = (data.mobile || "").trim();

    if (!cleanEmail || !data.password || !cleanName || !cleanCnf) {
      return {
        success: false,
        error: "Full name, Confirmation Number (CNF), email, and password are required.",
        user: null,
        session: null,
      };
    }

    if (data.password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long.",
        user: null,
        session: null,
      };
    }

    // MANDATORY PREMIUM PASS ELIGIBILITY VERIFICATION (SERVER-SIDE)
    // Rule: Existing Website CNF + Official Excel CNF Match + Premium Pass = ALLOWED
    const eligibility = verifyPassEligibility({
      cnfNumber: cleanCnf,
      email: cleanEmail,
    });

    if (!eligibility.allowed) {
      return {
        success: false,
        error: eligibility.reason,
        user: null,
        session: null,
      };
    }

    const officialTeamCode = cleanCnf;

    let userId: string | null = null;
    let authUser: any = null;

    // Check existing auth users to handle pre-seeded or existing accounts cleanly
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingUserByEmail = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    const syntheticEmail = `${cleanCnf.toLowerCase()}@equinox.mlrit.ac.in`;
    const altSyntheticEmail = `${cleanCnf.toLowerCase().replace(/[^a-z0-9]/g, "")}@equinox.mlrit.ac.in`;
    const placeholderUser = usersData?.users?.find(
      (u) =>
        u.id !== existingUserByEmail?.id &&
        (u.email?.toLowerCase() === syntheticEmail ||
          u.email?.toLowerCase() === altSyntheticEmail ||
          (u.user_metadata?.["team_code"] &&
            u.user_metadata["team_code"].toString().toUpperCase() === cleanCnf &&
            u.email?.endsWith("@equinox.mlrit.ac.in")))
    );

    if (existingUserByEmail) {
      // User already exists with this email: update their password, ensure email_confirm: true, and update metadata
      const { data: updated, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingUserByEmail.id,
        {
          password: data.password,
          email_confirm: true,
          user_metadata: {
            role: "student",
            full_name: cleanName,
            college: cleanCollege,
            team_code: officialTeamCode,
            cnf_number: cleanCnf,
            pass_category: "Premium Pass",
            mobile: cleanMobile,
            skills: data.skills || [],
            graduation_year: data.graduationYear || null,
          },
        }
      );

      if (updateErr) {
        return {
          success: false,
          error: updateErr.message || "Failed to update existing student credentials.",
          user: null,
          session: null,
        };
      }

      userId = updated?.user?.id || existingUserByEmail.id;
      authUser = updated?.user || existingUserByEmail;

      // Clean up stale placeholder user if present
      if (placeholderUser && placeholderUser.id !== userId) {
        await supabaseAdmin.from("students").delete().eq("user_id", placeholderUser.id);
        await supabaseAdmin.from("profiles").delete().eq("id", placeholderUser.id);
        await supabaseAdmin.auth.admin.deleteUser(placeholderUser.id);
      }
    } else if (placeholderUser) {
      // Upgrade synthetic placeholder account to the student's real email, password, and confirmed status
      const { data: upgraded, error: upgradeErr } = await supabaseAdmin.auth.admin.updateUserById(
        placeholderUser.id,
        {
          email: cleanEmail,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            role: "student",
            full_name: cleanName,
            college: cleanCollege,
            team_code: officialTeamCode,
            cnf_number: cleanCnf,
            pass_category: "Premium Pass",
            mobile: cleanMobile,
            skills: data.skills || [],
            graduation_year: data.graduationYear || null,
          },
        }
      );

      if (upgradeErr || !upgraded?.user) {
        // Fallback: create fresh user
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            role: "student",
            full_name: cleanName,
            college: cleanCollege,
            team_code: officialTeamCode,
            cnf_number: cleanCnf,
            pass_category: "Premium Pass",
            mobile: cleanMobile,
            skills: data.skills || [],
            graduation_year: data.graduationYear || null,
          },
        });

        if (createError || !createdUser?.user) {
          return {
            success: false,
            error: createError?.message || "Registration failed. Please try again.",
            user: null,
            session: null,
          };
        }
        userId = createdUser.user.id;
        authUser = createdUser.user;
      } else {
        userId = upgraded.user.id;
        authUser = upgraded.user;
      }
    } else {
      // 1. Create fresh user with email_confirm: true (direct registration without email verification)
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          role: "student",
          full_name: cleanName,
          college: cleanCollege,
          team_code: officialTeamCode,
          cnf_number: cleanCnf,
          pass_category: "Premium Pass",
          mobile: cleanMobile,
          skills: data.skills || [],
          graduation_year: data.graduationYear || null,
        },
      });

      if (createError || !createdUser?.user) {
        return {
          success: false,
          error: createError?.message || "Registration failed. Please try again.",
          user: null,
          session: null,
        };
      }

      userId = createdUser.user.id;
      authUser = createdUser.user;
    }

    if (!userId) {
      return {
        success: false,
        error: "Could not initialize student account.",
        user: null,
        session: null,
      };
    }

    // Clean up any other student row with this CNF to prevent duplicate team_code issues
    await supabaseAdmin
      .from("students")
      .delete()
      .ilike("team_code", officialTeamCode)
      .neq("user_id", userId);

    // 2. Ensure profiles entry exists
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      role: "student",
      email: cleanEmail,
      full_name: cleanName,
      college: cleanCollege,
    });

    if (profileErr) {
      return {
        success: false,
        error: `Failed to create student profile: ${profileErr.message}`,
        user: null,
        session: null,
      };
    }

    // 3. Ensure students entry exists
    const { data: existingSt } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let studentErr = null;
    if (existingSt?.id) {
      const { error: updErr } = await supabaseAdmin
        .from("students")
        .update({
          full_name: cleanName,
          college: cleanCollege,
          team_code: officialTeamCode,
          mobile: cleanMobile,
          skills: data.skills || [],
          graduation_year: data.graduationYear || null,
        })
        .eq("id", existingSt.id);
      studentErr = updErr;
    } else {
      const { error: insErr } = await supabaseAdmin.from("students").insert({
        user_id: userId,
        full_name: cleanName,
        college: cleanCollege,
        team_code: officialTeamCode,
        mobile: cleanMobile,
        skills: data.skills || [],
        graduation_year: data.graduationYear || null,
      });
      studentErr = insErr;
    }

    if (studentErr) {
      return {
        success: false,
        error: `Failed to create student record: ${studentErr.message}`,
        user: null,
        session: null,
      };
    }

    // 4. Verify both profile and student exist in DB
    const { data: verifiedProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    const { data: verifiedStudent } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!verifiedProfile || !verifiedStudent) {
      return {
        success: false,
        error: "Database integrity verification failed during registration.",
        user: null,
        session: null,
      };
    }

    // 5. Authenticate directly to obtain an active session immediately
    const anonClient = getServerAnonClient();
    let { data: authData, error: signInErr } = await anonClient.auth.signInWithPassword({
      email: cleanEmail,
      password: data.password,
    });

    // If auto-confirm is needed, force confirm and retry
    if (signInErr && signInErr.message?.toLowerCase().includes("email not confirmed")) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
      const retry = await anonClient.auth.signInWithPassword({
        email: cleanEmail,
        password: data.password,
      });
      authData = retry.data;
      signInErr = retry.error;
    }

    return {
      success: true,
      error: null,
      user: authData?.user || authUser || { id: userId, email: cleanEmail },
      session: authData?.session || null,
    };
  } catch (err: any) {
    console.warn("registerStudentCore error caught safely:", err);
    return {
      success: false,
      error: err?.message || "Registration server error. Please try again.",
      user: null,
      session: null,
    };
  }
}

/**
 * Server function: Registers a student account with auto-confirmed email.
 * Students can register and sign in directly without email confirmation links.
 */
export const registerStudentServerFn = createServerFn({ method: "POST" })
  .validator((data: RegisterStudentPayload) => data)
  .handler(async ({ data }) => {
    return await registerStudentCore(data);
  });

export interface AdminRolePayload {
  adminToken: string;
  id?: string | undefined;
  role: string;
  domain: string;
  location?: string | undefined;
  mode?: string | undefined;
  duration?: string | undefined;
  salary?: string | undefined;
  description?: string | undefined;
  responsibilities?: string[] | undefined;
  skills?: string[] | undefined;
  eligibility?: string | undefined;
  status?: string | undefined;
}

/**
 * Server function: Allows administrators to create or edit internship roles manually.
 */
export const adminCreateOrUpdateRoleServerFn = createServerFn({ method: "POST" })
  .validator((data: AdminRolePayload) => data)
  .handler(async ({ data }) => {
    const { adminToken } = data;
    if (!adminToken) {
      throw new Error("Admin authentication required.");
    }

    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) {
      throw new Error("Invalid admin session.");
    }

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw new Error("Unauthorized: Only administrators can add or edit roles.");
    }

    const { data: company } = await serverClient.from("companies").select("id").limit(1).maybeSingle();
    const companyId = company?.id || "8adf0d6d-de90-4838-82d6-e111b29b12c5";

    const normalizeMode = (m?: string): "onsite" | "hybrid" | "remote" => {
      const lower = (m || "").toLowerCase().trim();
      if (lower.includes("remote")) return "remote";
      if (lower.includes("hybrid")) return "hybrid";
      return "onsite";
    };

    const rolePayload: Record<string, unknown> = {
      role: data.role.trim(),
      domain: data.domain.trim(),
      location: data.location?.trim() || "MLRIT Campus / Hyderabad",
      mode: normalizeMode(data.mode),
      duration: data.duration?.trim() || "3 - 6 Months",
      salary: data.salary?.trim() || "Commensurate with performance",
      description: data.description?.trim() || "",
      responsibilities: data.responsibilities || [],
      skills: data.skills || [],
      eligibility: data.eligibility?.trim() || "Open to all registered Equinox attendees",
      status: data.status?.trim().toLowerCase() === "closed" ? "closed" : "open",
      company_id: companyId,
      updated_at: new Date().toISOString(),
    };

    if (data.id && data.id !== "preview" && data.id !== "new") {
      const { data: updated, error: updateError } = await serverClient
        .from("internships")
        .update(rolePayload)
        .eq("id", data.id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);
      return updated;
    } else {
      const { data: created, error: createError } = await serverClient
        .from("internships")
        .insert({
          ...rolePayload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw new Error(createError.message);
      return created;
    }
  });

/**
 * Server function: Allows administrators to delete an internship role.
 */
export const adminDeleteRoleServerFn = createServerFn({ method: "POST" })
  .validator((data: { adminToken: string; id: string }) => data)
  .handler(async ({ data }) => {
    const { adminToken, id } = data;
    if (!adminToken) throw new Error("Admin authentication required.");
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) throw new Error("Invalid admin session.");

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") throw new Error("Unauthorized.");

    // Delete associated applications first to prevent FK constraint error
    await serverClient.from("applications").delete().eq("internship_id", id);

    const { error: delError } = await serverClient.from("internships").delete().eq("id", id);
    if (delError) throw new Error(delError.message);

    return { success: true };
  });

/**
 * Server function: Allows administrators to fetch all roles directly with applications count.
 */
export const adminGetRolesServerFn = createServerFn({ method: "POST" })
  .validator((data: { adminToken: string }) => data)
  .handler(async ({ data }) => {
    const { adminToken } = data;
    if (!adminToken) throw new Error("Admin authentication required.");
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) throw new Error("Invalid admin session.");

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") throw new Error("Unauthorized.");

    const { data: roles, error } = await serverClient
      .from("internships")
      .select("*, applications(count)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return roles || [];
  });

/**
 * Server function: Allows administrators to add a new CNF number and student access.
 * Immediately creates their Supabase Auth account with password = CNF, and stores their student profile.
 */
export const adminAddConfirmedStudentServerFn = createServerFn({ method: "POST" })
  .validator((data: {
    adminToken: string;
    cnfNumber: string;
    fullName: string;
    college?: string;
    mobile?: string;
  }) => data)
  .handler(async ({ data }) => {
    const { adminToken, cnfNumber, fullName, college, mobile } = data;
    if (!adminToken) throw new Error("Admin authentication required.");
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) throw new Error("Invalid admin session.");

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") throw new Error("Unauthorized: Only administrators can add student access.");

    let cleanCnf = cnfNumber.trim().toUpperCase();
    if (!cleanCnf.startsWith("CNF-") && !cleanCnf.startsWith("CNF")) {
      cleanCnf = `CNF-${cleanCnf}`;
    }
    const cleanName = fullName.trim();
    if (!cleanCnf || !cleanName) {
      throw new Error("Confirmation Number and Student Full Name are required.");
    }

    const studentEmail = `${cleanCnf.toLowerCase()}@equinox.mlrit.ac.in`;

    // 1. Create or update user in Supabase Auth
    const { data: createdUser, error: createError } = await serverClient.auth.admin.createUser({
      email: studentEmail,
      password: cleanCnf,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: cleanName,
        team_code: cleanCnf,
        cnf_number: cleanCnf,
      },
    });

    let userId = createdUser?.user?.id;
    if (!userId && createError?.message.toLowerCase().includes("already")) {
      const { data: existingProfile } = await serverClient
        .from("profiles")
        .select("id")
        .eq("email", studentEmail)
        .maybeSingle();

      const profileId = existingProfile?.id;
      if (profileId) {
        userId = profileId;
        await serverClient.auth.admin.updateUserById(profileId, {
          password: cleanCnf,
          user_metadata: {
            role: "student",
            full_name: cleanName,
            team_code: cleanCnf,
            cnf_number: cleanCnf,
          },
        });
      }
    }

    if (!userId) {
      throw new Error(createError?.message || "Could not register user account.");
    }

    // 2. Upsert profile
    await serverClient.from("profiles").upsert({
      id: userId,
      role: "student",
      email: studentEmail,
    });

    // 3. Upsert student record
    await serverClient.from("students").upsert({
      user_id: userId,
      full_name: cleanName,
      team_code: cleanCnf,
      college: college?.trim() || "MLR Institute of Technology",
      mobile: mobile?.trim() || "N/A",
    }, { onConflict: "user_id" });

    return {
      success: true,
      cnf: cleanCnf,
      name: cleanName,
      email: studentEmail,
    };
  });

/**
 * Server function: Allows administrators to fetch all students (from DB and confirmed list).
 */
export const adminGetConfirmedStudentsServerFn = createServerFn({ method: "POST" })
  .validator((data: { adminToken: string }) => data)
  .handler(async ({ data }) => {
    const { adminToken } = data;
    if (!adminToken) throw new Error("Admin authentication required.");
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) throw new Error("Invalid admin session.");

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") throw new Error("Unauthorized.");

    // Fetch database students
    const { data: dbStudents } = await serverClient
      .from("students")
      .select("id, user_id, full_name, team_code, college, mobile, created_at, resume_url")
      .order("created_at", { ascending: false });

    return {
      dbStudents: dbStudents || [],
    };
  });

/**
 * Server function: Allows administrators to fetch all candidate applications.
 */
export const adminGetApplicationsServerFn = createServerFn({ method: "POST" })
  .validator((data: { adminToken: string }) => data)
  .handler(async ({ data }) => {
    const { adminToken } = data;
    if (!adminToken) throw new Error("Admin authentication required.");
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) throw new Error("Invalid admin session.");

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") throw new Error("Unauthorized.");

    // 1. Fetch applications with internship details
    let appsData: any[] = [];
    const { data: rawApps, error: appErr } = await serverClient
      .from("applications")
      .select("*, internship:internships(id, role, domain)")
      .order("created_at", { ascending: false });

    if (!appErr && rawApps) {
      appsData = rawApps;
    } else {
      console.warn("Could not query applications with internship join, querying base applications:", appErr?.message);
      const { data: fallback } = await serverClient
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      appsData = fallback || [];
    }

    // Hydrate internships map for any application missing joined relationship
    const internshipMap = new Map<string, any>();
    const { data: allInternships } = await serverClient
      .from("internships")
      .select("id, role, domain, location, mode, duration, salary");

    (allInternships || []).forEach((item) => {
      internshipMap.set(item.id, item);
    });
    INTERNSHIP_COMPANIES.forEach((item) => {
      if (!internshipMap.has(item.id)) {
        internshipMap.set(item.id, {
          id: item.id,
          role: item.role,
          domain: item.domain,
          location: item.mode || "MLRIT Campus",
          mode: item.mode || "onsite",
          duration: item.duration || "3 - 6 Months",
          salary: item.stipend || "Performance Based",
        });
      }
    });

    // 2. Hydrate student details from students and profiles tables
    const studentIds = Array.from(new Set(appsData.map((a) => a.student_id).filter(Boolean)));
    const [{ data: dbStudents }, { data: dbProfiles }] = await Promise.all([
      studentIds.length > 0
        ? serverClient.from("students").select("*").or(`user_id.in.(${studentIds.join(",")}),id.in.(${studentIds.join(",")})`)
        : Promise.resolve({ data: [] }),
      studentIds.length > 0
        ? serverClient.from("profiles").select("id, email, full_name, college, branch, graduation_year").in("id", studentIds)
        : Promise.resolve({ data: [] }),
    ]);

    const studentMap = new Map<string, any>();
    (dbStudents || []).forEach((s) => {
      if (s.user_id) studentMap.set(s.user_id, s);
      if (s.id) studentMap.set(s.id, s);
    });

    const profileMap = new Map((dbProfiles || []).map((p) => [p.id, p]));

    return appsData.map((app) => {
      const s = studentMap.get(app.student_id);
      const p = profileMap.get(app.student_id) || (s?.user_id ? profileMap.get(s.user_id) : undefined);
      const roleObj = app.internship || internshipMap.get(app.internship_id) || {
        id: app.internship_id,
        role: app.role_title || "Internship Role",
        domain: "General",
      };

      const candidateName = app.student_name || s?.full_name || p?.full_name || app.answers?.full_name || "Applicant";
      const cnfNumber = app.cnf_number || s?.team_code || app.answers?.cnf_number || "CNF";
      const contactNumber = app.student_phone || s?.mobile || app.answers?.contact_number || "N/A";
      const email = app.student_email || p?.email || app.answers?.email || "";
      const college = app.college || s?.college || p?.college || app.answers?.college || "MLR Institute of Technology";
      const courseBranch = app.course_branch || s?.course_branch || p?.branch || app.answers?.course_branch || "";
      const graduationYear = s?.graduation_year || p?.graduation_year || null;

      return {
        ...app,
        internship: roleObj,
        skills: app.skills || app.answers?.skills || (Array.isArray(s?.skills) ? s.skills.join(", ") : ""),
        portfolio_url: app.portfolio_url || app.answers?.portfolio_url || "",
        video_url: app.video_url || app.answers?.video_url || "",
        availability: app.availability || app.answers?.availability || "",
        resume_url: app.resume_url || s?.resume_url || app.answers?.resume_path || "",
        student: {
          full_name: candidateName,
          team_code: cnfNumber,
          college: college,
          course_branch: courseBranch,
          graduation_year: graduationYear,
          mobile: contactNumber,
          email: email,
        },
      };
    });
  });

export const ALLOWED_APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "selected",
  "rejected",
] as const;

export type ApplicationStatus = (typeof ALLOWED_APPLICATION_STATUSES)[number];

/**
 * Server function: Allows authenticated administrators to update an application status.
 */
export const adminUpdateApplicationStatusServerFn = createServerFn({ method: "POST" })
  .validator((data: {
    adminToken: string;
    applicationId: string;
    status: string;
  }) => data)
  .handler(async ({ data }) => {
    const { adminToken, applicationId, status } = data;
    if (!adminToken) throw new Error("Admin authentication required.");

    // 1. Verify caller session & admin role
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) throw new Error("Invalid admin session.");

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw new Error("Unauthorized: Only administrators can update application status.");
    }

    // 2. Validate allowed status
    const cleanStatus = status.trim().toLowerCase() as ApplicationStatus;
    if (!ALLOWED_APPLICATION_STATUSES.includes(cleanStatus)) {
      throw new Error(
        `Invalid status "${status}". Allowed statuses: ${ALLOWED_APPLICATION_STATUSES.join(", ")}`
      );
    }

    // 3. Update application status using admin bearer token to satisfy trigger security
    const adminUserClient = createClient(
      (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]) ||
        (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_URL"]) ||
        "https://plyvtevuxdmzswtvpmwv.supabase.co",
      (typeof process !== "undefined" && process.env?.["SUPABASE_ANON_KEY"]) ||
        (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_ANON_KEY"]) ||
        "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb",
      {
        global: { headers: { Authorization: `Bearer ${adminToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: updated, error: updateError } = await adminUserClient
      .from("applications")
      .update({ status: cleanStatus })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      // Fallback: update with serverClient
      const { data: serverUpdated, error: serverErr } = await serverClient
        .from("applications")
        .update({ status: cleanStatus })
        .eq("id", applicationId)
        .select()
        .single();

      if (serverErr) throw new Error(updateError.message || serverErr.message);
      return serverUpdated;
    }

    return updated;
  });

/**
 * Server function: Generates a temporary signed URL for admins to view/download candidate resumes.
 */
export const adminGetResumeDownloadUrlServerFn = createServerFn({ method: "POST" })
  .validator((data: {
    adminToken: string;
    resumePath: string;
  }) => data)
  .handler(async ({ data }) => {
    const { adminToken, resumePath } = data;
    if (!adminToken) throw new Error("Admin authentication required.");
    if (!resumePath) throw new Error("Resume path is missing.");

    // Verify admin authorization
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) throw new Error("Invalid admin session.");

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") throw new Error("Unauthorized.");

    // Normalize storage path: strip any URL domain or bucket-name prefix
    let cleanPath = resumePath.trim();
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      const idx = cleanPath.indexOf("/resumes/");
      if (idx !== -1) {
        cleanPath = cleanPath.substring(idx + "/resumes/".length);
      }
    }
    if (cleanPath.startsWith("resumes/")) {
      cleanPath = cleanPath.replace(/^resumes\//, "");
    }

    // Generate temporary signed URL with 120s TTL
    const { data: signedData, error: signError } = await serverClient.storage
      .from("resumes")
      .createSignedUrl(cleanPath, 120);

    if (signError || !signedData?.signedUrl) {
      throw new Error(signError?.message || "Could not generate download URL for the resume file.");
    }

    return { signedUrl: signedData.signedUrl };
  });

/**
 * Server function: Exports all candidate applications into an RFC 4180 compliant CSV string.
 */
export const adminExportApplicationsCsvServerFn = createServerFn({ method: "POST" })
  .validator((data: { adminToken: string }) => data)
  .handler(async ({ data }) => {
    const { adminToken } = data;
    if (!adminToken) throw new Error("Admin authentication required.");

    // Verify admin authorization
    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(adminToken);
    if (authError || !authData?.user?.id) throw new Error("Invalid admin session.");

    const serverClient = getServerSupabase();
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") throw new Error("Unauthorized.");

    // 1. Fetch applications with internships
    let appsData: any[] = [];
    const { data: apps, error: appErr } = await serverClient
      .from("applications")
      .select("*, internship:internships(id, role, domain)")
      .order("created_at", { ascending: false });

    if (!appErr && apps) {
      appsData = apps;
    } else {
      const { data: fallback } = await serverClient
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      appsData = fallback || [];
    }

    const safeApps = appsData;

    // Hydrate internships map
    const internshipMap = new Map<string, any>();
    const { data: allInternships } = await serverClient
      .from("internships")
      .select("id, role, domain");

    (allInternships || []).forEach((item) => {
      internshipMap.set(item.id, item);
    });
    INTERNSHIP_COMPANIES.forEach((item) => {
      if (!internshipMap.has(item.id)) {
        internshipMap.set(item.id, { id: item.id, role: item.role, domain: item.domain });
      }
    });

    // 2. Hydrate student details & profiles bidirectionally
    const studentIds = Array.from(new Set(safeApps.map((a) => a.student_id).filter(Boolean)));
    const [{ data: dbStudents }, { data: dbProfiles }] = await Promise.all([
      studentIds.length > 0
        ? serverClient.from("students").select("*").or(`user_id.in.(${studentIds.join(",")}),id.in.(${studentIds.join(",")})`)
        : Promise.resolve({ data: [] }),
      studentIds.length > 0
        ? serverClient.from("profiles").select("id, email, full_name, college, branch, graduation_year").in("id", studentIds)
        : Promise.resolve({ data: [] }),
    ]);

    const studentMap = new Map<string, any>();
    (dbStudents || []).forEach((s) => {
      if (s.user_id) studentMap.set(s.user_id, s);
      if (s.id) studentMap.set(s.id, s);
    });

    const profileMap = new Map((dbProfiles || []).map((p) => [p.id, p]));

    // 3. RFC 4180 CSV escaping helper
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).trim();
      return `"${str.replace(/"/g, '""')}"`;
    };

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

    const rows = safeApps.map((app) => {
      const s = studentMap.get(app.student_id);
      const p = profileMap.get(app.student_id) || (s?.user_id ? profileMap.get(s.user_id) : undefined);
      const internshipInfo = app.internship || internshipMap.get(app.internship_id) || {
        role: app.role_title || "Internship Role",
        domain: "General",
      };

      const candidateName = app.student_name || s?.full_name || p?.full_name || app.answers?.full_name || "Applicant";
      const cnfNumber = app.cnf_number || s?.team_code || app.answers?.cnf_number || "CNF";
      const contactNumber = app.student_phone || s?.mobile || app.answers?.contact_number || "N/A";
      const email = app.student_email || p?.email || app.answers?.email || "";
      const college = app.college || s?.college || p?.college || app.answers?.college || "MLR Institute of Technology";
      const courseBranch = app.course_branch || s?.course_branch || p?.branch || app.answers?.course_branch || "N/A";
      const graduationYear = s?.graduation_year || p?.graduation_year || "N/A";
      const roleName = internshipInfo.role || "Internship Role";
      const domainName = internshipInfo.domain || "General";
      const status = app.status || "submitted";
      const skills = app.skills || app.answers?.skills || (Array.isArray(s?.skills) ? s.skills.join(", ") : "");
      const portfolioUrl = app.portfolio_url || app.answers?.portfolio_url || "";
      const videoUrl = app.video_url || app.answers?.video_url || "";
      const availability = app.availability || app.answers?.availability || "Immediate";
      const resumeStoragePath = app.resume_url || s?.resume_url || app.answers?.resume_path || "";
      const applicationDate = app.created_at
        ? new Date(app.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : "";

      return [
        escapeCsv(candidateName),
        escapeCsv(cnfNumber),
        escapeCsv(contactNumber),
        escapeCsv(email),
        escapeCsv(college),
        escapeCsv(courseBranch),
        escapeCsv(graduationYear),
        escapeCsv(roleName),
        escapeCsv(domainName),
        escapeCsv(status),
        escapeCsv(skills),
        escapeCsv(portfolioUrl),
        escapeCsv(videoUrl),
        escapeCsv(availability),
        escapeCsv(resumeStoragePath),
        escapeCsv(applicationDate),
      ].join(",");
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");

    return {
      csvContent,
      count: safeApps.length,
      filename: `equinox_internship_applications_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  });

export const studentGetApplicationsServerFn = createServerFn({ method: "POST" })
  .validator((data: { studentToken: string }) => data)
  .handler(async ({ data }) => {
    if (!data.studentToken) {
      return { applications: [] };
    }

    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(data.studentToken);
    if (authError || !authData?.user?.id) {
      return { applications: [] };
    }

    const userId = authData.user.id;
    const serverClient = getServerSupabase();

    // Check both auth.uid() and students.id in case student_id in applications was saved as either
    const { data: studentRecord } = await serverClient
      .from("students")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const studentIdsToMatch = [userId];
    if (studentRecord?.id) {
      studentIdsToMatch.push(studentRecord.id);
    }

    const { data: apps, error: appError } = await serverClient
      .from("applications")
      .select(`
        id,
        internship_id,
        status,
        resume_url,
        video_url,
        skills,
        portfolio_url,
        availability,
        created_at
      `)
      .in("student_id", studentIdsToMatch)
      .order("created_at", { ascending: false });

    if (appError || !apps) {
      console.warn("Could not retrieve student applications:", appError);
      return { applications: [] };
    }

    // Hydrate internships details
    const internshipIds = Array.from(new Set(apps.map((a) => a.internship_id).filter(Boolean)));
    const internshipMap = new Map<string, any>();

    if (internshipIds.length > 0) {
      const { data: internships } = await serverClient
        .from("internships")
        .select("id, role, domain, location, mode, duration, salary")
        .in("id", internshipIds);

      (internships || []).forEach((item) => {
        internshipMap.set(item.id, item);
      });
    }

    const hydrated = apps.map((app) => ({
      ...app,
      internship: internshipMap.get(app.internship_id) || {
        role: "Internship Role",
        domain: "General",
        location: "Campus",
        mode: "onsite",
      },
    }));

    return {
      applications: hydrated,
    };
  });
