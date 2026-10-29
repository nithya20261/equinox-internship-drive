import { supabase } from "./supabase";
import { loginUser } from "./auth";
import {
  loginStudentServerFn,
  loginAdminServerFn,
  studentSubmitApplicationServerFn,
  registerStudentServerFn,
  adminCreateOrUpdateRoleServerFn,
  adminDeleteRoleServerFn,
  adminGetRolesServerFn,
  adminAddConfirmedStudentServerFn,
  adminGetConfirmedStudentsServerFn,
  adminGetApplicationsServerFn,
} from "./server-auth";

const RESUME_BUCKET = "resumes";

import { INTERNSHIP_COMPANIES } from "@/data/companies";

export interface StudentRegistrationInput {
  full_name: string;
  email: string;
  password: string;
  college: string;
  team_code: string;
  mobile: string;
  skills?: string[];
  graduation_year?: number;
  resume?: File | null;
}

export interface Opportunity {
  id: string;
  role: string;
  domain?: string;
  location?: string;
  mode?: string;
  duration?: string;
  description?: string;
  responsibilities?: string | string[];
  skills?: string | string[];
  eligibility?: string;
  salary?: string;
  deadline?: string;
  status: string;
  created_at: string;
  company?: string;
  requirement?: string;
  stipend?: string;
}

export interface StudentApplicationFormData {
  fullName: string;
  contactNumber: string;
  email: string;
  instituteAndBranch: string;
  preferredRole: string; // internshipId
  resumeFile: File;
  videoUrl: string; // Google Drive self-introduction video link
  relevantSkills: string;
  portfolioUrl?: string | undefined; // Optional: Projects / Portfolio / GitHub / LinkedIn
  availability: string;
}

export interface StudentApplication {
  id: string;
  internship_id: string;
  status: string;
  created_at: string;
  resume_url?: string | null;
  video_url?: string | null;
  skills?: string | null;
  portfolio_url?: string | null;
  availability?: string | null;
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
 * Register a student directly without requiring email verification.
 * Creates an auto-confirmed user account, profile, and student entry,
 * and activates the authenticated session immediately.
 */
export async function registerStudentWithResume(input: StudentRegistrationInput) {
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanTeamCode = input.team_code.trim().toUpperCase();

  const result = await registerStudentServerFn({
    data: {
      email: cleanEmail,
      password: input.password,
      fullName: input.full_name,
      college: input.college,
      teamCode: cleanTeamCode,
      mobile: input.mobile,
      skills: input.skills ?? [],
      graduationYear: input.graduation_year ?? null,
    },
  });

  if (result.session) {
    // Restore authenticated session in client Supabase instance
    await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });
  }

  const user = result.user;
  if (user) {
    loginUser({
      id: user.id,
      role: "student",
      name: input.full_name.trim(),
      teamCode: cleanTeamCode,
      email: cleanEmail,
    });
  }

  return { confirmationRequired: false, user };
}

/**
 * Student login using secure server-side authentication with rate limiting.
 * The student's email is NEVER exposed or returned to unauthenticated clients.
 */
export async function loginStudent(credentials: {
  cnfNumber?: string;
  email?: string;
  teamCode?: string;
  name?: string;
  password: string;
}) {
  const cnfNumber = (credentials.cnfNumber || credentials.teamCode || credentials.email || "").trim().toUpperCase();
  const fullName = (credentials.name || "").trim();

  // Execute server-side authenticated flow with rate-limiting & zero email leakage
  const result = await loginStudentServerFn({
    data: {
      cnfNumber,
      fullName,
      teamCode: cnfNumber,
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
    name: student?.full_name || (meta?.["full_name"] as string | undefined) || fullName || cnfNumber,
    teamCode: student?.team_code || (meta?.["team_code"] as string | undefined) || cnfNumber,
    email: result.user.email ?? undefined,
  });

  return result;
}

/**
 * Administrator login accepting strictly username EQUINOXCIE.
 * Authenticates against Supabase Auth via server function with rate limiting.
 */
export async function loginAdmin(credentials: { username: string; password: string }) {
  try {
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
  } catch (err) {
    if (import.meta.env.DEV && credentials.username.trim().toUpperCase() === "EQUINOXCIE") {
      const devAdmin = {
        id: "dev-admin-id",
        role: "admin" as const,
        email: "equinoxcie@admin.equinox.internal",
        name: "CIE Lead Administrator",
      };
      loginUser(devAdmin);
      return { user: devAdmin };
    }
    throw err;
  }
}

/**
 * Fetch real internship listings including participating companies and roles.
 */
export async function getOpportunities(): Promise<Opportunity[]> {
  const companyListings: Opportunity[] = INTERNSHIP_COMPANIES.map((item) => ({
    id: item.id,
    role: item.role || item.company,
    company: item.company,
    domain: item.domain || "General",
    mode: item.mode,
    duration: item.duration,
    description: item.description,
    requirement: item.requirement,
    stipend: item.stipend,
    location: item.mode || "MLRIT Campus",
    status: "open",
    created_at: new Date().toISOString(),
  }));

  try {
    const { data } = await supabase
      .from("public_opportunities")
      .select(
        "id, role, domain, location, mode, duration, description, responsibilities, skills, eligibility, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const existingIds = new Set(companyListings.map((c) => c.id));
      const dbOps: Opportunity[] = data
        .filter((item) => !existingIds.has(item.id))
        .map((item) => ({
          ...item,
          company: "Partner Organization (Confidential)",
        }));
      return [...companyListings, ...dbOps];
    }
  } catch {}

  return companyListings;
}

/**
 * Fetch opportunity by ID.
 */
export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const found = INTERNSHIP_COMPANIES.find((c) => c.id === id);
  if (found) {
    return {
      id: found.id,
      role: found.role || found.company,
      company: found.company,
      domain: found.domain || "General",
      mode: found.mode,
      duration: found.duration,
      description: found.description,
      requirement: found.requirement,
      stipend: found.stipend,
      location: found.mode || "MLRIT Campus",
      status: "open",
      created_at: new Date().toISOString(),
    };
  }

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
 * Admin action to fetch all internships directly from Supabase.
 */
export async function adminGetRoles(): Promise<any[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    if (import.meta.env.DEV) {
      try {
        const { data } = await supabase.from("public_opportunities").select("*");
        if (data && data.length > 0) return data;
      } catch {}
      return [];
    }
    throw new Error("Admin authentication required.");
  }

  return await adminGetRolesServerFn({
    data: { adminToken: session.access_token },
  });
}

/**
 * Admin action to manually add or update role details in Supabase.
 */
export async function adminCreateOrUpdateRole(roleData: {
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
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    if (import.meta.env.DEV) {
      return { success: true, role: { id: roleData.id || "dev-role-" + Date.now(), ...roleData } };
    }
    throw new Error("Admin authentication required.");
  }

  return await adminCreateOrUpdateRoleServerFn({
    data: {
      adminToken: session.access_token,
      ...roleData,
    },
  });
}

/**
 * Admin action to permanently delete an internship role.
 */
export async function adminDeleteRole(id: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    if (import.meta.env.DEV) {
      return { success: true };
    }
    throw new Error("Admin authentication required.");
  }

  return await adminDeleteRoleServerFn({
    data: {
      adminToken: session.access_token,
      id,
    },
  });
}

/**
 * Admin action to add a new confirmed student CNF number and grant login access immediately.
 */
export async function adminAddConfirmedStudent(studentData: {
  cnfNumber: string;
  fullName: string;
  college?: string;
  mobile?: string;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    if (import.meta.env.DEV) {
      return {
        success: true,
        cnf: studentData.cnfNumber,
        name: studentData.fullName,
        email: "dev@student.equinox.internal",
      };
    }
    throw new Error("Admin authentication required.");
  }

  return await adminAddConfirmedStudentServerFn({
    data: {
      adminToken: session.access_token,
      ...studentData,
    },
  });
}

/**
 * Admin action to retrieve confirmed students (from DB and preloaded master list).
 */
export async function adminGetConfirmedStudents() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    if (import.meta.env.DEV) {
      return { dbStudents: [] };
    }
    throw new Error("Admin authentication required.");
  }

  return await adminGetConfirmedStudentsServerFn({
    data: { adminToken: session.access_token },
  });
}

/**
 * Admin action to retrieve candidate applications.
 */
export async function adminGetApplications() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    if (import.meta.env.DEV) {
      return [];
    }
    throw new Error("Admin authentication required.");
  }

  return await adminGetApplicationsServerFn({
    data: { adminToken: session.access_token },
  });
}

/**
 * Equinox Career Connect 10-field student application submission.
 * Validates the 10 fields, uploads the resume to the private storage bucket,
 * and records the application with Google Drive self-introduction video link in Supabase.
 */
export async function submitStudentApplication(
  form: StudentApplicationFormData
): Promise<{ alreadyApplied: boolean; success: boolean }> {
  if (!form.fullName.trim()) throw new Error("Full Name is required.");
  if (!form.contactNumber.trim()) throw new Error("Contact Number is required.");
  if (!form.email.trim()) throw new Error("Email Address is required.");
  if (!form.instituteAndBranch.trim()) throw new Error("Institute Name and Current Course / Branch is required.");
  if (!form.preferredRole.trim()) throw new Error("Please select your Preferred Internship Role.");
  if (!form.resumeFile) throw new Error("Resume / CV file upload is required.");
  if (!form.videoUrl.trim()) throw new Error("One-Minute Self-Introduction Video Google Drive link is required.");
  if (!form.relevantSkills.trim()) throw new Error("Relevant Skills are required.");
  if (!form.availability.trim()) throw new Error("Internship Availability is required.");

  // Validate Google Drive link or video URL
  const cleanVideoUrl = form.videoUrl.trim();
  if (!cleanVideoUrl.startsWith("http://") && !cleanVideoUrl.startsWith("https://")) {
    throw new Error("Please enter a valid link for the self-introduction video (e.g. https://drive.google.com/...).");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session?.user) {
    throw new Error("Please log in to your student account before submitting the application.");
  }

  // 1. Upload resume to private 'resumes' storage bucket
  const resumePath = await uploadResumeFile(session.user.id, form.resumeFile);

  // 2. Submit application record with video link and student data
  const result = await studentSubmitApplicationServerFn({
    data: {
      studentToken: session.access_token,
      internshipIds: [form.preferredRole],
      resumePath,
      fullName: form.fullName.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      instituteAndBranch: form.instituteAndBranch.trim(),
      videoUrl: cleanVideoUrl,
      skills: form.relevantSkills.trim(),
      portfolioUrl: form.portfolioUrl?.trim() || undefined,
      availability: form.availability.trim(),
    },
  });

  if (result.duplicateCount > 0 && result.appliedCount === 0) {
    return { alreadyApplied: true, success: false };
  }

  return { alreadyApplied: false, success: true };
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session?.user) {
    throw new Error("Please log in before submitting applications.");
  }

  // 1. Upload resume to private 'resumes' storage bucket if provided
  let resumePath: string | null = null;
  if (input.customResume) {
    resumePath = await uploadResumeFile(session.user.id, input.customResume);
  }

  // 2. Delegate application submission and duplicate prevention to secure server function
  const result = await studentSubmitApplicationServerFn({
    data: {
      studentToken: session.access_token,
      internshipIds: input.internshipIds,
      resumePath,
    },
  });

  return result;
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
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Error fetching applications:", error.message);
    return [];
  }

  const metaVideoUrl = (user.user_metadata as Record<string, unknown> | undefined)?.["video_url"] as string | undefined;

  return (data || []).map((app: any) => ({
    ...app,
    video_url: app.video_url || metaVideoUrl || null,
  })) as StudentApplication[];
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
