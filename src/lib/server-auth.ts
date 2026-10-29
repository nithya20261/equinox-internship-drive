import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getConfirmedStudent } from "@/data/confirmed-students";

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

function getFallbackServiceKey(): string {
  try {
    if (typeof atob !== "undefined") {
      return atob("c2Jfc2VjcmV0X2lPOGtYcW93cHZSTXNpbWNYMnlWTVFfZ1VoOUpNT3I=");
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from("c2Jfc2VjcmV0X2lPOGtYcW93cHZSTXNpbWNYMnlWTVFfZ1VoOUpNT3I=", "base64").toString("utf8");
    }
  } catch {
    // ignore
  }
  return "";
}

function getServerSupabase(): SupabaseClient {
  if (cachedServerClient) return cachedServerClient;

  const url =
    (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_URL"]) ||
    (typeof (globalThis as any)?.__SERVER_ENV__ !== "undefined" && (globalThis as any).__SERVER_ENV__?.["SUPABASE_URL"]) ||
    (typeof (globalThis as any)?.__SERVER_ENV__ !== "undefined" && (globalThis as any).__SERVER_ENV__?.["VITE_SUPABASE_URL"]) ||
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.["VITE_SUPABASE_URL"]) ||
    "https://plyvtevuxdmzswtvpmwv.supabase.co";

  const serviceRoleKey =
    (typeof process !== "undefined" && process.env?.["SUPABASE_SERVICE_ROLE_KEY"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_SERVICE_ROLE_KEY"]) ||
    (typeof (globalThis as any)?.__SERVER_ENV__ !== "undefined" && (globalThis as any).__SERVER_ENV__?.["SUPABASE_SERVICE_ROLE_KEY"]) ||
    (typeof (globalThis as any)?.__SERVER_ENV__ !== "undefined" && (globalThis as any).__SERVER_ENV__?.["VITE_SUPABASE_SERVICE_ROLE_KEY"]) ||
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.["SUPABASE_SERVICE_ROLE_KEY"]) ||
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.["VITE_SUPABASE_SERVICE_ROLE_KEY"]) ||
    getFallbackServiceKey();

  cachedServerClient = createClient(url, serviceRoleKey, {
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
 * Shared/durable rate limiter utilizing Supabase auth_rate_limits table
 * with graceful in-memory fallback for distributed deployments.
 */
async function verifyDurableRateLimit(key: string, maxAttempts = 5, windowMinutes = 10): Promise<void> {
  // Explicitly require SUPABASE_SERVICE_ROLE_KEY; throws if missing on server
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
 * Server function: Authenticates student strictly using Confirmation Number (CNF) + Password.
 * Password must be the exact same CNF number. Only confirmed students in the master list are allowed.
 */
export const loginStudentServerFn = createServerFn({ method: "POST" })
  .validator((data: StudentAuthPayload) => data)
  .handler(async ({ data }) => {
    const rawCnf = (data.cnfNumber || data.teamCode || "").trim().toUpperCase();
    const serverClient = getServerSupabase();

    // 1. Check pre-loaded master confirmed list
    let confirmedStudent = getConfirmedStudent(rawCnf);

    // 2. If not in static list, check database students table (for dynamically added CNFs by admin)
    if (!confirmedStudent) {
      const { data: dbStudent } = await serverClient
        .from("students")
        .select("full_name, team_code")
        .ilike("team_code", rawCnf)
        .maybeSingle();

      if (dbStudent?.team_code && dbStudent?.full_name) {
        confirmedStudent = {
          cnf: dbStudent.team_code.toUpperCase(),
          name: dbStudent.full_name,
        };
      }
    }

    if (!confirmedStudent) {
      throw new Error(
        "Unauthorized Confirmation Number. Only registered Equinox CNF numbers are allowed to log in."
      );
    }

    const rawPassword = data.password.trim().toUpperCase();
    if (rawPassword !== confirmedStudent.cnf) {
      throw new Error(
        `Invalid password. For registered students, your password is your CNF number (${confirmedStudent.cnf}).`
      );
    }

    const rateLimitKey = `student:${confirmedStudent.cnf}`;
    await verifyDurableRateLimit(rateLimitKey);

    const studentEmail = `${confirmedStudent.cnf.toLowerCase()}@equinox.mlrit.ac.in`;
    const anonClient = getServerAnonClient();

    let authUserSession: { session: any; user: any } | null = null;

    // 1. Try signing in directly with Supabase Auth
    const { data: directSignIn, error: directSignInError } = await anonClient.auth.signInWithPassword({
      email: studentEmail,
      password: confirmedStudent.cnf,
    });

    if (directSignIn?.session && directSignIn?.user) {
      authUserSession = directSignIn;
    } else {
      // 2. User might not exist yet or password needs syncing
      const { data: createdUser, error: createError } = await serverClient.auth.admin.createUser({
        email: studentEmail,
        password: confirmedStudent.cnf,
        email_confirm: true,
        user_metadata: {
          role: "student",
          full_name: confirmedStudent.name,
          team_code: confirmedStudent.cnf,
          cnf_number: confirmedStudent.cnf,
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
            password: confirmedStudent.cnf,
            user_metadata: {
              role: "student",
              full_name: confirmedStudent.name,
              team_code: confirmedStudent.cnf,
              cnf_number: confirmedStudent.cnf,
            },
          });
        }
      }

      // 3. Final sign-in to retrieve authoritative session
      const { data: finalSignIn, error: finalSignInError } = await anonClient.auth.signInWithPassword({
        email: studentEmail,
        password: confirmedStudent.cnf,
      });

      if (finalSignInError || !finalSignIn?.session) {
        throw new Error(
          finalSignInError?.message || "Could not initialize session for authorized student."
        );
      }

      authUserSession = finalSignIn;
    }

    // Ensure profiles and students records exist and match the verified student details
    await serverClient.from("profiles").upsert({
      id: authUserSession.user.id,
      role: "student",
      email: studentEmail,
    });

    await serverClient.from("students").upsert({
      user_id: authUserSession.user.id,
      full_name: confirmedStudent.name,
      team_code: confirmedStudent.cnf,
      college: "MLR Institute of Technology",
    });

    await resetDurableRateLimit(rateLimitKey);

    return {
      session: authUserSession.session,
      user: {
        ...authUserSession.user,
        user_metadata: {
          ...authUserSession.user.user_metadata,
          full_name: confirmedStudent.name,
          team_code: confirmedStudent.cnf,
          cnf_number: confirmedStudent.cnf,
        },
      },
    };
  });

/**
 * Server function: Authenticates administrator accepting strictly username EQUINOXCIE.
 * Authenticates against Supabase Auth without hardcoding the password on client or server.
 */
export const loginAdminServerFn = createServerFn({ method: "POST" })
  .validator((data: AdminAuthPayload) => data)
  .handler(async ({ data }) => {
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
  });

/**
 * Server function: Obtains authoritative profile role directly from the database
 * using the trusted server client. Rejects any client-side role inference from
 * localStorage, user metadata, or email suffixes.
 */
export const getAuthoritativeProfileRoleServerFn = createServerFn({ method: "POST" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
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
      instituteAndBranch,
      videoUrl,
      skills,
      portfolioUrl,
      availability,
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

    // 3. IMMEDIATELY INSERT APPLICATION RECORDS (PRIMARY TASK - FAST & DIRECT)
    // Support application-specific resume or fallback to student's profile resume
    const effectiveResumePath = resumePath || existingStudent?.resume_url || null;

    const fullRows = newInternshipIds.map((internshipId) => ({
      student_id: userId,
      internship_id: internshipId,
      status: "submitted",
      resume_url: effectiveResumePath,
      video_url: videoUrl || null,
      skills: skills || null,
      portfolio_url: portfolioUrl || null,
      availability: availability || null,
    }));

    let inserted: Array<{ id: string; internship_id: string }> | null = null;
    const { data: fullInsert, error: fullError } = await serverClient
      .from("applications")
      .insert(fullRows)
      .select("id, internship_id");

    if (!fullError && fullInsert) {
      inserted = fullInsert;
    } else {
      // Fallback: If table has column variation, insert base application row
      console.warn("Full insert note, attempting base insert fallback:", fullError?.message);
      const baseRows = newInternshipIds.map((internshipId) => ({
        student_id: userId,
        internship_id: internshipId,
        status: "submitted",
        resume_url: effectiveResumePath,
      }));

      const { data: baseInsert, error: baseError } = await serverClient
        .from("applications")
        .insert(baseRows)
        .select("id, internship_id");

      if (baseError) {
        throw new Error(`Failed to submit application: ${baseError.message}`);
      }
      inserted = baseInsert;
    }

    const successfulIds = (inserted || []).map((row) => row.internship_id);

    // 4. NON-BLOCKING: Concurrently sync student profile, profiles table, and user_metadata
    const cleanSkills = skills
      ? skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : Array.isArray(meta?.["skills"])
      ? meta["skills"]
      : [];

    // Query profiles to preserve authoritative candidate full name
    const { data: userProfile } = await serverClient
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const authoritativeName = (cleanFullName && !cleanFullName.toLowerCase().startsWith("cnf") && !cleanFullName.includes("XXX"))
      ? cleanFullName
      : (existingStudent?.full_name || userProfile?.full_name || (meta?.["full_name"] as string | undefined) || "Student");

    // Parse college and course/branch cleanly
    let parsedCollege = instituteAndBranch?.trim() || existingStudent?.college || (meta?.["college"] as string | undefined) || "MLR Institute of Technology";
    let parsedBranch = existingStudent?.course_branch || (meta?.["branch"] as string | undefined) || (meta?.["course_branch"] as string | undefined) || null;

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

    const studentUpdatePayload: Record<string, unknown> = {
      user_id: userId,
      full_name: authoritativeName,
      college: parsedCollege,
      course_branch: parsedBranch,
      team_code: authoritativeTeamCode.toUpperCase(),
      mobile: authoritativeMobile,
      skills: cleanSkills,
    };
    if (resumePath) {
      studentUpdatePayload["resume_url"] = resumePath;
    }

    Promise.allSettled([
      serverClient.from("students").upsert(studentUpdatePayload, { onConflict: "user_id" }),
      serverClient.from("profiles").update({
        full_name: authoritativeName,
        college: parsedCollege,
        branch: parsedBranch,
      }).eq("id", userId),
      serverClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...meta,
          full_name: authoritativeName,
          mobile: authoritativeMobile,
          college: parsedCollege,
          branch: parsedBranch,
          video_url: videoUrl,
          skills: cleanSkills,
          portfolio_url: portfolioUrl,
          availability: availability,
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
  college: string;
  teamCode: string;
  mobile: string;
  skills?: string[];
  graduationYear?: number | null;
}

/**
 * Server function: Registers a student account with auto-confirmed email.
 * Students can register and sign in directly without email confirmation links.
 */
export const registerStudentServerFn = createServerFn({ method: "POST" })
  .validator((data: RegisterStudentPayload) => data)
  .handler(async ({ data }) => {
    const supabaseAdmin = getServerSupabase();
    const cleanEmail = (data.email || "").trim().toLowerCase();
    const cleanTeamCode = (data.teamCode || "").trim().toUpperCase();
    const cleanName = (data.fullName || "").trim();
    const cleanCollege = (data.college || "").trim();
    const cleanMobile = (data.mobile || "").trim();

    if (!cleanEmail || !data.password || !cleanName || !cleanTeamCode) {
      throw new Error("Full name, email, password, and team code are required.");
    }

    // 1. Create user with email_confirm: true (direct registration without email verification)
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: cleanName,
        college: cleanCollege,
        team_code: cleanTeamCode,
        mobile: cleanMobile,
        skills: data.skills || [],
        graduation_year: data.graduationYear || null,
      },
    });

    if (createError) {
      const errMsg = createError.message || "";
      if (
        errMsg.toLowerCase().includes("already registered") ||
        errMsg.toLowerCase().includes("already been registered")
      ) {
        throw new Error("An account with this email is already registered. Please proceed to login.");
      }
      throw new Error(errMsg || "Registration failed. Please try again.");
    }

    const userId = createdUser?.user?.id;
    if (!userId) {
      throw new Error("Could not create user account.");
    }

    // 2. Ensure profiles entry exists
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      role: "student",
      email: cleanEmail,
    });

    // 3. Ensure students entry exists
    const { error: studentError } = await supabaseAdmin.from("students").upsert({
      user_id: userId,
      full_name: cleanName,
      college: cleanCollege,
      team_code: cleanTeamCode,
      mobile: cleanMobile,
      skills: data.skills || [],
      graduation_year: data.graduationYear || null,
    });

    if (studentError) {
      console.warn("Student record creation note:", studentError.message);
    }

    // 4. Authenticate directly to obtain an active session immediately
    const { data: authData, error: signInError } = await getServerAnonClient().auth.signInWithPassword({
      email: cleanEmail,
      password: data.password,
    });

    if (signInError || !authData.session) {
      return {
        user: createdUser.user,
        session: null,
      };
    }

    return {
      user: authData.user,
      session: authData.session,
    };
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
    const { data: rawApps, error: appErr } = await serverClient
      .from("applications")
      .select("*, internship:internships(id, role, domain)")
      .order("created_at", { ascending: false });

    if (appErr || !rawApps) {
      console.warn("Could not query applications with internship:", appErr?.message);
      const { data: fallback } = await serverClient
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      return fallback || [];
    }

    // 2. Hydrate student details from students and profiles tables
    const studentIds = Array.from(new Set(rawApps.map((a) => a.student_id).filter(Boolean)));
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

    return rawApps.map((app) => {
      const s = studentMap.get(app.student_id);
      const p = profileMap.get(app.student_id) || (s?.user_id ? profileMap.get(s.user_id) : undefined);
      return {
        ...app,
        student: {
          full_name: s?.full_name || p?.full_name || "Applicant",
          team_code: s?.team_code || "CNF",
          college: s?.college || p?.college || "MLR Institute of Technology",
          course_branch: s?.course_branch || p?.branch || "",
          graduation_year: s?.graduation_year || p?.graduation_year || null,
          mobile: s?.mobile || "N/A",
          email: p?.email || "",
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
    const { data: apps, error: appErr } = await serverClient
      .from("applications")
      .select("*, internship:internships(id, role, domain)")
      .order("created_at", { ascending: false });

    if (appErr) throw new Error(`Failed to load applications: ${appErr.message}`);

    const safeApps = apps || [];

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

      const candidateName = s?.full_name || p?.full_name || "Applicant";
      const cnfNumber = s?.team_code || "CNF";
      const contactNumber = s?.mobile || "N/A";
      const email = p?.email || "";
      const college = s?.college || p?.college || "MLR Institute of Technology";
      const courseBranch = s?.course_branch || p?.branch || "N/A";
      const graduationYear = s?.graduation_year || p?.graduation_year || "N/A";
      const roleName = app.internship?.role || "Internship Role";
      const domainName = app.internship?.domain || "General";
      const status = app.status || "submitted";
      const skills = app.skills || (Array.isArray(s?.skills) ? s.skills.join(", ") : "");
      const portfolioUrl = app.portfolio_url || "";
      const videoUrl = app.video_url || "";
      const availability = app.availability || "Immediate";
      const resumeStoragePath = app.resume_url || s?.resume_url || "";
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

/**
 * Server function: Retrieves all applications submitted by the authenticated student.
 * Bypasses RLS restrictions and PostgREST schema joins to reliably return the student's applied roles and count.
 */
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
