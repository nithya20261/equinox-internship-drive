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

function getServerSupabase(): SupabaseClient {
  if (cachedServerClient) return cachedServerClient;

  const url =
    (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]) ||
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_URL"]) ||
    "https://plyvtevuxdmzswtvpmwv.supabase.co";

  const serviceRoleKey =
    typeof process !== "undefined" ? process.env?.["SUPABASE_SERVICE_ROLE_KEY"] : undefined;

  if (!serviceRoleKey) {
    throw new Error(
      "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required on the server to execute secure authentication functions."
    );
  }

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
    const confirmedStudent = getConfirmedStudent(rawCnf);

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
    const serverClient = getServerSupabase();
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
    const { data: authData, error: authError } = await getServerAnonClient().auth.signInWithPassword({
      email: adminEmail,
      password: data.password,
    });

    if (authError || !authData.session) {
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
        .select("role")
        .eq("id", data.userId)
        .maybeSingle();

      if (error || !profile?.role) {
        return { role: null };
      }

      if (profile.role === "admin" || profile.role === "student") {
        return { role: profile.role as "admin" | "student" };
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

    const { data: authData, error: authError } = await getServerAnonClient().auth.getUser(studentToken);
    if (authError || !authData?.user?.id) {
      throw new Error("Invalid or expired session. Please log in again.");
    }

    const userId = authData.user.id;
    const serverClient = getServerSupabase();
    const meta = authData.user.user_metadata || {};

    // 1. Update/upsert student details in public.students table
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
      full_name: fullName || (meta?.["full_name"] as string | undefined) || "Applicant",
      college: instituteAndBranch || (meta?.["college"] as string | undefined) || "Unknown",
      team_code: ((meta?.["team_code"] as string | undefined) || "EQX-APP").toUpperCase(),
      mobile: contactNumber || (meta?.["mobile"] as string | undefined) || "N/A",
      skills: cleanSkills,
    };
    if (resumePath) {
      studentUpdatePayload["resume_url"] = resumePath;
    }

    try {
      await serverClient.from("students").upsert(studentUpdatePayload, { onConflict: "user_id" });
    } catch (e) {
      console.warn("Could not upsert student profile:", e);
    }

    // 2. Also keep user_metadata updated with application fields including video link
    try {
      await serverClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...meta,
          full_name: fullName || meta?.["full_name"],
          mobile: contactNumber || meta?.["mobile"],
          college: instituteAndBranch || meta?.["college"],
          video_url: videoUrl,
          skills: cleanSkills,
          portfolio_url: portfolioUrl,
          availability: availability,
        },
      });
    } catch (e) {
      console.warn("Could not sync user_metadata:", e);
    }

    // 3. Filter out already applied internships to prevent unique constraint errors
    const { data: existingApps } = await serverClient
      .from("applications")
      .select("internship_id")
      .eq("student_id", userId)
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

    // 4. Insert application records
    // First try full row with new fields (video_url, skills, portfolio_url, availability)
    const fullRows = newInternshipIds.map((internshipId) => ({
      student_id: userId,
      internship_id: internshipId,
      status: "submitted",
      resume_url: resumePath,
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
      // Fallback: If table does not yet have newly migrated columns, insert base application row
      console.warn("Full insert note, attempting base insert fallback:", fullError?.message);
      const baseRows = newInternshipIds.map((internshipId) => ({
        student_id: userId,
        internship_id: internshipId,
        status: "submitted",
        resume_url: resumePath,
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
  description?: string | undefined;
  responsibilities?: string[] | undefined;
  skills?: string[] | undefined;
  eligibility?: string | undefined;
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

    const rolePayload: Record<string, unknown> = {
      role: data.role.trim(),
      domain: data.domain.trim(),
      location: data.location?.trim() || "MLRIT Campus",
      mode: data.mode?.trim() || "On-Campus",
      description: data.description?.trim() || "",
      responsibilities: data.responsibilities || [],
      skills: data.skills || [],
      eligibility: data.eligibility?.trim() || "Open to all registered Equinox attendees",
      status: "open",
      company_id: companyId,
      updated_at: new Date().toISOString(),
    };

    if (data.id && data.id !== "preview") {
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


