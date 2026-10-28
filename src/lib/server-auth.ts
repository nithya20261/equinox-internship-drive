import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  fullName: string;
  teamCode: string;
  password: string;
}

export interface AdminAuthPayload {
  username: string;
  password: string;
}

/**
 * Server function: Authenticates student using Full Name + Team Code + Password.
 * Resolves the student email securely on the server with rate limiting.
 * The student's email is NEVER returned to unauthenticated clients.
 */
export const loginStudentServerFn = createServerFn({ method: "POST" })
  .validator((data: StudentAuthPayload) => data)
  .handler(async ({ data }) => {
    // Strictly require SUPABASE_SERVICE_ROLE_KEY on the server
    const serverClient = getServerSupabase();

    const cleanName = data.fullName.trim();
    const cleanCode = data.teamCode.trim().toUpperCase();
    const rateLimitKey = `student:${cleanCode}`;

    await verifyDurableRateLimit(rateLimitKey);

    let studentEmail: string | null = null;

    // Direct email entry
    if (cleanCode.includes("@")) {
      studentEmail = cleanCode.toLowerCase();
    } else {
      // Server-side lookup: Requires BOTH verified full name and team code
      const { data: lookedUpEmail, error: rpcError } = await serverClient.rpc(
        "lookup_student_email_by_team_code",
        {
          lookup_code: cleanCode,
          lookup_name: cleanName,
        }
      );

      if (rpcError || !lookedUpEmail) {
        throw new Error(
          "Could not verify your student account. Please verify your Full Name and Team Code, or log in with your registered email."
        );
      }

      studentEmail = (lookedUpEmail as string).toLowerCase();
    }

    // Authenticate with Supabase Auth using the separate anon/publishable-key client
    const { data: authData, error: authError } = await getServerAnonClient().auth.signInWithPassword({
      email: studentEmail,
      password: data.password,
    });

    if (authError || !authData.session) {
      if (authError?.message.toLowerCase().includes("email not confirmed")) {
        throw new Error("Email not verified yet. Please check your inbox for the confirmation link.");
      }
      throw new Error("Invalid student credentials. Please check your password.");
    }

    // Strict profile check via server-only service_role client: reject if missing, error, or role not exactly 'student'
    const { data: profile, error: profileError } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "student") {
      throw new Error("This account is not authorized as a registered student.");
    }

    // Login succeeded: clear rate limit
    await resetDurableRateLimit(rateLimitKey);

    return {
      session: authData.session,
      user: authData.user,
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
