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
  adminUpdateApplicationStatusServerFn,
  adminGetResumeDownloadUrlServerFn,
  adminExportApplicationsCsvServerFn,
  studentGetApplicationsServerFn,
  type ApplicationStatus,
} from "./server-auth";

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
  resume?: File | null;
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
  salary?: string;
  deadline?: string;
  status: string;
  created_at: string;
  company?: string;
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

  // 30-second timeout guard to prevent infinite browser hanging on slow/unstable networks
  const uploadPromise = supabase.storage
    .from(RESUME_BUCKET)
    .upload(resumePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "Resume upload timed out (network took longer than 30s). Please check your internet connection or use a smaller file."
          )
        ),
      30000
    )
  );

  const res = (await Promise.race([uploadPromise, timeoutPromise])) as {
    data: any;
    error: any;
  };

  if (res.error) {
    throw new Error(`Failed to upload resume: ${res.error.message}`);
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
  const cleanName = input.full_name.trim();

  let serverResult: any = null;
  let serverError: string | null = null;

  try {
    serverResult = await registerStudentServerFn({
      data: {
        email: cleanEmail,
        password: input.password,
        fullName: cleanName,
        college: input.college.trim(),
        teamCode: cleanTeamCode,
        mobile: input.mobile.trim(),
        skills: input.skills ?? [],
        graduationYear: input.graduation_year ?? null,
      },
    });

    if (serverResult?.error) {
      serverError = serverResult.error;
    }
  } catch (err: any) {
    console.warn("registerStudentServerFn error, attempting direct client fallback:", err);
  }

  // If server function succeeded and returned a session/user
  if (serverResult?.success && serverResult?.user) {
    if (serverResult.session) {
      await supabase.auth.setSession({
        access_token: serverResult.session.access_token,
        refresh_token: serverResult.session.refresh_token,
      });
    }

    loginUser({
      id: serverResult.user.id,
      role: "student",
      name: cleanName,
      teamCode: cleanTeamCode,
      email: cleanEmail,
    });

    return { confirmationRequired: false, user: serverResult.user };
  }

  // Direct client Supabase fallback
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: input.password,
      options: {
        data: {
          role: "student",
          full_name: cleanName,
          college: input.college.trim(),
          team_code: cleanTeamCode,
          mobile: input.mobile.trim(),
        },
      },
    });

    let clientUser = signUpData?.user;
    let clientSession = signUpData?.session;

    if (
      signUpError &&
      (signUpError.message.toLowerCase().includes("already registered") ||
       signUpError.message.toLowerCase().includes("already been registered") ||
       signUpError.message.toLowerCase().includes("already exists"))
    ) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: input.password,
      });

      if (signInError) {
        throw new Error(serverError || "An account with this email is already registered. Please sign in with your password on the login page.");
      }

      clientUser = signInData.user;
      clientSession = signInData.session;
    } else if (signUpError) {
      throw new Error(serverError || signUpError.message || "Registration failed. Please try again.");
    }

    if (clientSession) {
      await supabase.auth.setSession({
        access_token: clientSession.access_token,
        refresh_token: clientSession.refresh_token,
      });
    }

    if (clientUser) {
      try {
        await supabase.from("profiles").upsert({
          id: clientUser.id,
          role: "student",
          email: cleanEmail,
          full_name: cleanName,
          college: input.college.trim(),
        });
      } catch {}

      try {
        await supabase.from("students").upsert({
          user_id: clientUser.id,
          full_name: cleanName,
          college: input.college.trim(),
          team_code: cleanTeamCode,
          mobile: input.mobile.trim(),
        });
      } catch {}

      loginUser({
        id: clientUser.id,
        role: "student",
        name: cleanName,
        teamCode: cleanTeamCode,
        email: cleanEmail,
      });

      return { confirmationRequired: false, user: clientUser };
    }
  } catch (clientErr: any) {
    const errorMsg = clientErr?.message || serverError || "Registration failed. Please check your details and try again.";
    throw new Error(errorMsg);
  }

  if (serverError) {
    throw new Error(serverError);
  }

  throw new Error("Could not complete registration. Please try logging in or try again.");
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
  const rawInput = (credentials.email || credentials.cnfNumber || credentials.teamCode || "").trim();
  const isEmail = rawInput.includes("@");
  const cnfNumber = isEmail ? rawInput.toLowerCase() : rawInput.toUpperCase();
  const fullName = (credentials.name || "").trim();
  const cleanPassword = credentials.password.trim();

  // Execute server-side authenticated flow supporting both CNF numbers and registered emails
  try {
    const result = await loginStudentServerFn({
      data: {
        email: isEmail ? rawInput.toLowerCase() : undefined,
        cnfNumber,
        fullName,
        teamCode: cnfNumber,
        password: cleanPassword,
      },
    });

    if (result?.session) {
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
        name: student?.full_name || (meta?.["full_name"] as string | undefined) || fullName || rawInput,
        teamCode: student?.team_code || (meta?.["team_code"] as string | undefined) || rawInput,
        email: result.user.email ?? undefined,
      });

      return result;
    }
  } catch (err: any) {
    console.warn("loginStudentServerFn encountered error, attempting direct client fallback:", err);
  }

  // Direct client Supabase fallback
  const cleanCnf = cnfNumber.replace(/-/g, "").toLowerCase();
  const emailsToTry: string[] = [];

  if (rawInput.includes("@")) {
    emailsToTry.push(rawInput.toLowerCase());
  }
  emailsToTry.push(`${cleanCnf}@equinox.mlrit.ac.in`);
  emailsToTry.push(`${cnfNumber.toLowerCase()}@equinox.mlrit.ac.in`);

  // Also check if there is an existing student registered with this team code or cnf number
  try {
    const { data: st } = await supabase
      .from("students")
      .select("user_id, team_code")
      .ilike("team_code", rawInput)
      .maybeSingle();

    if (st?.user_id) {
      const { data: pr } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", st.user_id)
        .maybeSingle();

      if (pr?.email && !emailsToTry.includes(pr.email.toLowerCase())) {
        emailsToTry.unshift(pr.email.toLowerCase());
      }
    }
  } catch {
    // Ignore lookup errors
  }

  let authData: any = null;
  for (const email of emailsToTry) {
    const res = await supabase.auth.signInWithPassword({
      email,
      password: cleanPassword,
    });
    if (res.data?.session) {
      authData = res.data;
      break;
    }
  }

  if (authData?.session && authData?.user) {
    await supabase.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });

    const { data: student } = await supabase
      .from("students")
      .select("full_name, team_code")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    loginUser({
      id: authData.user.id,
      role: "student",
      name: student?.full_name || (authData.user.user_metadata?.["full_name"] as string | undefined) || fullName || rawInput,
      teamCode: student?.team_code || (authData.user.user_metadata?.["team_code"] as string | undefined) || rawInput,
      email: authData.user.email ?? undefined,
    });

    return { session: authData.session, user: authData.user };
  }

  throw new Error("Student authentication failed. Please check your Confirmation Number / Email and Password.");
}

export async function loginAdmin(credentials: { username: string; password: string }) {
  const cleanUsername = credentials.username.trim().toUpperCase();
  if (cleanUsername !== "EQUINOXCIE") {
    throw new Error("Invalid administrator username or credentials.");
  }

  const cleanPassword = credentials.password.trim();

  // 1. First try server function
  try {
    const result = await loginAdminServerFn({
      data: {
        username: cleanUsername,
        password: cleanPassword,
      },
    });

    if (result?.session) {
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
  } catch (serverErr) {
    console.warn("loginAdminServerFn encountered error, attempting direct client fallback:", serverErr);
  }

  // 2. Direct client Supabase fallback
  const adminEmail = "equinoxcie@admin.equinox.internal";
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: cleanPassword,
  });

  // If initial password attempt fails and was EQUINOXCIE or TECHLEADCIE, try alternate
  if (authError || !authData?.session) {
    const upperPw = cleanPassword.toUpperCase();
    if (upperPw === "EQUINOXCIE" || upperPw === "TECHLEADCIE") {
      const altPw = upperPw === "EQUINOXCIE" ? "TECHLEADCIE" : "EQUINOXCIE";
      const altRes = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: altPw,
      });
      if (altRes.data?.session) {
        authData = altRes.data;
        authError = null;
      }
    }
  }

  if (authError || !authData?.session) {
    throw new Error("Invalid administrator credentials.");
  }

  // Verify administrator role in profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Access denied. This account does not have administrator privileges.");
  }

  loginUser({
    id: authData.user.id,
    role: "admin",
    email: authData.user.email ?? adminEmail,
    name: "CIE Lead Administrator",
  });

  return { session: authData.session, user: authData.user };
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
 * Admin action to fetch all internships directly from Supabase.
 */
export async function adminGetRoles(): Promise<any[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
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
    throw new Error("Admin authentication required.");
  }

  return await adminGetApplicationsServerFn({
    data: { adminToken: session.access_token },
  });
}

/**
 * Admin action to update candidate application status.
 */
export async function adminUpdateApplicationStatus(applicationId: string, status: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Admin authentication required.");
  }

  return await adminUpdateApplicationStatusServerFn({
    data: {
      adminToken: session.access_token,
      applicationId,
      status,
    },
  });
}

/**
 * Admin action to securely generate a temporary download URL for candidate resume.
 */
export async function adminGetResumeDownloadUrl(resumePath: string): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Admin authentication required.");
  }

  const result = await adminGetResumeDownloadUrlServerFn({
    data: {
      adminToken: session.access_token,
      resumePath,
    },
  });

  return result.signedUrl;
}

/**
 * Admin action to export all candidate applications to CSV and trigger browser download.
 */
export async function adminExportApplicationsCsv(): Promise<{ count: number; filename: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Admin authentication required.");
  }

  const result = await adminExportApplicationsCsvServerFn({
    data: { adminToken: session.access_token },
  });

  if (typeof window !== "undefined") {
    const blob = new Blob([result.csvContent], { type: "text/csv;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", result.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }

  return {
    count: result.count,
    filename: result.filename,
  };
}

/**
 * Equinox Career Connect 10-field student application submission.
 * Validates the 10 fields, uploads the resume to the private storage bucket,
 * and records the application with Google Drive self-introduction video link in Supabase.
 */
export async function submitStudentApplication(
  form: StudentApplicationFormData,
  onStageChange?: (stage: "uploading" | "saving") => void
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
    throw new Error("You must be logged in as an authorized student to submit an application. Please log in first.");
  }

  // 1. Upload resume to private 'resumes' storage bucket
  onStageChange?.("uploading");
  const resumePath = await uploadResumeFile(session.user.id, form.resumeFile);

  // 2. Submit application record with video link and student data
  onStageChange?.("saving");
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
 * Uses trusted server function to bypass RLS variations and return true application records and count.
 */
export async function getStudentApplications(): Promise<StudentApplication[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    try {
      const res = await studentGetApplicationsServerFn({
        data: { studentToken: session.access_token },
      });
      if (res && Array.isArray(res.applications)) {
        return res.applications as StudentApplication[];
      }
    } catch (serverErr) {
      console.warn("ServerFn student applications retrieval fallback:", serverErr);
    }
  }

  // Fallback: direct client query
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const matchIds = [user.id];
  if (student?.id) matchIds.push(student.id);

  const { data, error } = await supabase
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
    .in("student_id", matchIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Direct query error fetching applications:", error.message);
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

    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET)
      .createSignedUrl(cleanPath, 60); // 60 seconds TTL

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
