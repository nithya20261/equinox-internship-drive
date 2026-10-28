import { supabase } from "./supabase";
import { loginUser } from "./auth";
import { loginStudentServerFn, loginAdminServerFn } from "./server-auth";

const RESUME_BUCKET = "resumes";

export interface StudentRegistrationInput {
  full_name: string;
  email: string;
  password: string;
  college: string;
  team_code: string;
  mobile: string;
  skills?: string[];
  graduation_year?: number;
  resume: File;
}

export interface Opportunity {
  id: string;
  role: string;
  domain: string;
  location: string;
  mode: string;
  duration: string;
  description?: string;
  responsibilities?: string | string[];
  skills?: string | string[];
  eligibility?: string;
  status: string;
  created_at: string;
  company?: string;
}

export interface StudentApplication {
  id: string;
  internship_id: string;
  status: string;
  created_at: string;
  resume_url?: string | null;
  internship?: {
    id: string;
    role: string;
    domain: string;
    location: string;
    mode: string;
    duration: string;
  };
}

export interface BatchApplicationInput {
  internshipIds: string[];
  customResume?: File | undefined;
}

export interface BatchApplicationResult {
  totalRequested: number;
  appliedCount: number;
  duplicateCount: number;
  alreadyAppliedIds: string[];
  successfulIds: string[];
}

/**
 * Validate and upload a resume file to the authenticated user's private folder in storage.
 */
export async function uploadResumeFile(userId: string, file: File): Promise<string> {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    throw new Error("Resume must be a PDF, DOC, or DOCX file.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Resume file must be under 10MB.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const resumePath = `${userId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(resumePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload resume: ${uploadError.message}`);
  }

  return resumePath;
}

/**
 * Register a student and upload their initial profile resume securely.
 * Handles email-confirmation mode gracefully if email confirmation is enabled in Supabase.
 */
export async function registerStudentWithResume(input: StudentRegistrationInput) {
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanTeamCode = input.team_code.trim().toUpperCase();

  // 1. Sign up with Supabase Auth including metadata
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: input.password,
    options: {
      data: {
        role: "student",
        full_name: input.full_name.trim(),
        college: input.college.trim(),
        team_code: cleanTeamCode,
        mobile: input.mobile.trim(),
        skills: input.skills ?? [],
        graduation_year: input.graduation_year ?? null,
      },
    },
  });

  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("Registration failed. Please try again.");

  // If email confirmation is required, session will be null
  if (!data.session) {
    return {
      confirmationRequired: true,
      message:
        "A verification email has been sent to your address. Please confirm your email before signing in.",
      user,
    };
  }

  // 2. Immediate session is active: Upsert profile record
  try {
    await supabase.from("profiles").upsert({
      id: user.id,
      role: "student",
      email: cleanEmail,
    });
  } catch (err) {
    console.warn("Profile creation note:", err);
  }

  // 3. Upload resume to private 'resumes' storage bucket
  let resumePath: string | null = null;
  if (input.resume) {
    try {
      resumePath = await uploadResumeFile(user.id, input.resume);
    } catch (err) {
      console.warn("Storage upload exception during registration:", err);
    }
  }

  // 4. Upsert student record
  const { error: studentError } = await supabase.from("students").upsert({
    user_id: user.id,
    full_name: input.full_name.trim(),
    college: input.college.trim(),
    team_code: cleanTeamCode,
    mobile: input.mobile.trim(),
    skills: input.skills ?? [],
    graduation_year: input.graduation_year ?? null,
    resume_url: resumePath,
  });

  if (studentError) {
    console.warn("Student record creation note:", studentError.message);
  }

  // 5. Update local auth state
  loginUser({
    id: user.id,
    role: "student",
    name: input.full_name,
    teamCode: cleanTeamCode,
    email: cleanEmail,
  });

  return { confirmationRequired: false, user };
}

/**
 * Student login using secure server-side authentication with rate limiting.
 * The student's email is NEVER exposed or returned to unauthenticated clients.
 */
export async function loginStudent(credentials: {
  email?: string;
  teamCode?: string;
  name?: string;
  password: string;
}) {
  const teamCodeOrEmail = (credentials.teamCode || credentials.email || "").trim();
  const fullName = (credentials.name || "").trim();

  // Execute server-side authenticated flow with rate-limiting & zero email leakage
  const result = await loginStudentServerFn({
    data: {
      fullName,
      teamCode: teamCodeOrEmail,
      password: credentials.password,
    },
  });

  if (!result?.session) {
    throw new Error("Student authentication failed.");
  }

  // Restore authenticated session in client Supabase instance
  await supabase.auth.setSession({
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token,
  });

  // Fetch student details for local store
  const { data: student } = await supabase
    .from("students")
    .select("full_name, team_code")
    .eq("user_id", result.user.id)
    .maybeSingle();

  const meta = result.user.user_metadata;
  loginUser({
    id: result.user.id,
    role: "student",
    name: student?.full_name || (meta?.["full_name"] as string | undefined) || fullName,
    teamCode: student?.team_code || (meta?.["team_code"] as string | undefined) || teamCodeOrEmail,
    email: result.user.email ?? undefined,
  });

  return result;
}

/**
 * Administrator login accepting strictly username EQUINOXCIE.
 * Authenticates against Supabase Auth via server function with rate limiting.
 */
export async function loginAdmin(credentials: { username: string; password: string }) {
  const result = await loginAdminServerFn({
    data: {
      username: credentials.username,
      password: credentials.password,
    },
  });

  if (!result?.session) {
    throw new Error("Administrator authentication failed.");
  }

  // Restore authenticated admin session in client Supabase instance
  await supabase.auth.setSession({
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token,
  });

  loginUser({
    id: result.user.id,
    role: "admin",
    email: result.user.email ?? "equinoxcie@admin.equinox.internal",
    name: "CIE Lead Administrator",
  });

  return result;
}

/**
 * Fetch real internship listings from Supabase using public_opportunities view.
 * Recruiter Shield: company_id is omitted and company name is masked as Confidential.
 */
export async function getOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("public_opportunities")
    .select(
      "id, role, domain, location, mode, duration, description, responsibilities, skills, eligibility, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Could not fetch opportunities from Supabase:", error.message);
    return [];
  }

  // Confidentiality protocol: Mask company identities from candidates
  return (data || []).map((item) => ({
    ...item,
    company: "Partner Organization (Confidential)",
  }));
}

/**
 * Fetch opportunity by ID without exposing company identity using public_opportunities view.
 */
export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const { data, error } = await supabase
    .from("public_opportunities")
    .select(
      "id, role, domain, location, mode, duration, description, responsibilities, skills, eligibility, status, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    company: "Partner Organization (Confidential)",
  };
}

/**
 * Submit a single internship application for the currently authenticated student.
 * Supports reusing the student's profile resume or uploading a custom resume for this specific role.
 */
export async function submitApplication(
  internshipId: string,
  options?: { customResume?: File | undefined }
) {
  const batchRes = await submitBatchApplications({
    internshipIds: [internshipId],
    customResume: options?.customResume,
  });

  if (batchRes.duplicateCount > 0 && batchRes.appliedCount === 0) {
    return { alreadyApplied: true };
  }

  return { alreadyApplied: false };
}

/**
 * Multi-internship application submission.
 * Creates a separate application record for each selected internship.
 * Prevents duplicate applications for the same internship by checking existing submissions.
 * Reuses profile resume OR uploads and attaches a custom tailored resume.
 */
export async function submitBatchApplications(
  input: BatchApplicationInput
): Promise<BatchApplicationResult> {
  if (!input.internshipIds || input.internshipIds.length === 0) {
    throw new Error("No internships selected.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please log in before submitting applications.");
  }

  // 1. Resolve student ID and existing profile resume
  let studentId: string | null = null;
  let profileResumeUrl: string | null = null;

  const { data: student } = await supabase
    .from("students")
    .select("id, resume_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (student?.id) {
    studentId = student.id;
    profileResumeUrl = student.resume_url;
  } else {
    // If student profile row missing, create it from auth metadata
    const meta = user.user_metadata;
    const { data: newStudent, error: createError } = await supabase
      .from("students")
      .insert({
        user_id: user.id,
        full_name: (meta?.["full_name"] as string | undefined) || "Applicant",
        college: (meta?.["college"] as string | undefined) || "Unknown",
        team_code: ((meta?.["team_code"] as string | undefined) || "EQX-APP").toUpperCase(),
        mobile: (meta?.["mobile"] as string | undefined) || "N/A",
      })
      .select("id, resume_url")
      .single();

    if (createError) throw createError;
    studentId = newStudent.id;
    profileResumeUrl = newStudent.resume_url;
  }

  // 2. Upload custom resume if provided. NULL explicitly denotes reusing student profile resume.
  let resumePath: string | null = null;
  if (input.customResume) {
    resumePath = await uploadResumeFile(user.id, input.customResume);
  }

  // 3. Check for existing applications among selected IDs to prevent duplicates
  const { data: existingApplications, error: checkError } = await supabase
    .from("applications")
    .select("internship_id")
    .eq("student_id", studentId)
    .in("internship_id", input.internshipIds);

  if (checkError) {
    console.warn("Duplicate check note:", checkError.message);
  }

  const alreadyAppliedIds = new Set(
    (existingApplications || []).map((app) => app.internship_id)
  );

  const newInternshipIds = input.internshipIds.filter(
    (id) => !alreadyAppliedIds.has(id)
  );

  if (newInternshipIds.length === 0) {
    return {
      totalRequested: input.internshipIds.length,
      appliedCount: 0,
      duplicateCount: input.internshipIds.length,
      alreadyAppliedIds: Array.from(alreadyAppliedIds),
      successfulIds: [],
    };
  }

  // 4. Insert one separate application record per selected internship
  const rowsToInsert = newInternshipIds.map((internshipId) => ({
    internship_id: internshipId,
    student_id: studentId,
    status: "submitted",
    resume_url: resumePath,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("applications")
    .insert(rowsToInsert)
    .select("id, internship_id");

  if (insertError) {
    throw insertError;
  }

  const successfulIds = (inserted || []).map((row) => row.internship_id);

  return {
    totalRequested: input.internshipIds.length,
    appliedCount: successfulIds.length,
    duplicateCount: alreadyAppliedIds.size,
    alreadyAppliedIds: Array.from(alreadyAppliedIds),
    successfulIds,
  };
}

/**
 * Get all applications submitted by the current student.
 */
export async function getStudentApplications(): Promise<StudentApplication[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student?.id) return [];

  const { data, error } = await supabase
    .from("applications")
    .select(`
      id,
      internship_id,
      status,
      resume_url,
      created_at,
      internship:internships (
        id,
        role,
        domain,
        location,
        mode,
        duration
      )
    `)
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Error fetching applications:", error.message);
    return [];
  }

  return (data as unknown as StudentApplication[]) || [];
}

/**
 * Get current student's full profile.
 */
export async function getStudentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    student: student || null,
  };
}

/**
 * Generate a temporary signed download URL for a private resume.
 * Resumes are NEVER made publicly readable.
 */
export async function getResumeDownloadUrl(resumePath: string): Promise<string | null> {
  if (!resumePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET)
      .createSignedUrl(resumePath, 60); // 60 seconds TTL

    if (error) {
      console.warn("Could not generate signed URL:", error.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.warn("Failed to create signed URL:", err);
    return null;
  }
}
