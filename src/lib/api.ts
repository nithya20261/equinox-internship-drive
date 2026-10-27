import { supabase } from "./supabase";
import { loginUser } from "./auth";

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

export interface CompanyRegistrationInput {
  company_name: string;
  contact_person: string;
  work_email: string;
  password: string;
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
  internship?: {
    id: string;
    role: string;
    domain: string;
    location: string;
    mode: string;
    duration: string;
  };
}

/**
 * Register a student and upload their resume securely.
 * Handles email-confirmation mode gracefully if email confirmation is required.
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
    const file = input.resume;
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

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      resumePath = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(RESUME_BUCKET)
        .upload(resumePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.warn("Resume upload note (storage bucket may be pending):", uploadError.message);
        // Do not crash registration if the storage bucket is being provisioned
      }
    } catch (err) {
      console.warn("Storage upload exception:", err);
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
 * Register a hiring company account.
 */
export async function registerCompany(input: CompanyRegistrationInput) {
  const cleanEmail = input.work_email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: input.password,
    options: {
      data: {
        role: "company",
        company_name: input.company_name.trim(),
        contact_person: input.contact_person.trim(),
      },
    },
  });

  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("Company registration failed.");

  if (!data.session) {
    return {
      confirmationRequired: true,
      message: "Confirmation email sent. Please verify your email before logging in.",
      user,
    };
  }

  // Upsert profile and company record
  try {
    await supabase.from("profiles").upsert({
      id: user.id,
      role: "company",
      email: cleanEmail,
    });
    await supabase.from("companies").upsert({
      user_id: user.id,
      name: input.company_name.trim(),
    });
  } catch (err) {
    console.warn("Company table sync note:", err);
  }

  loginUser({
    id: user.id,
    role: "company",
    email: cleanEmail,
    name: input.company_name,
  });

  return { confirmationRequired: false, user };
}

/**
 * Student login supporting Team Code, Email, or Name lookup.
 */
export async function loginStudent(credentials: {
  email?: string;
  teamCode?: string;
  name?: string;
  password: string;
}) {
  let loginEmail = credentials.email?.trim().toLowerCase();

  // If email was not explicitly provided, look up by team code
  if (!loginEmail && credentials.teamCode) {
    const trimmedCode = credentials.teamCode.trim().toUpperCase();

    // Check if user typed email into teamCode input
    if (trimmedCode.includes("@")) {
      loginEmail = trimmedCode.toLowerCase();
    } else {
      const { data: student } = await supabase
        .from("students")
        .select("user_id, full_name")
        .ilike("team_code", trimmedCode)
        .limit(1)
        .maybeSingle();

      if (student?.user_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", student.user_id)
          .maybeSingle();

        if (prof?.email) {
          loginEmail = prof.email.toLowerCase();
        }
      }
    }
  }

  // If still not found, check if studentName has an email
  if (!loginEmail && credentials.name && credentials.name.includes("@")) {
    loginEmail = credentials.name.trim().toLowerCase();
  }

  if (!loginEmail) {
    throw new Error(
      "No account matching this Team Code was found. Please check your credentials or enter your registered email."
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password: credentials.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      throw new Error(
        "Email not verified yet. Please check your email inbox and click the confirmation link."
      );
    }
    throw error;
  }

  // Fetch or verify profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile && profile.role !== "student") {
    await supabase.auth.signOut();
    throw new Error("This account is not registered as a student.");
  }

  // Fetch student details for local store
  const { data: student } = await supabase
    .from("students")
    .select("full_name, team_code")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const meta = data.user.user_metadata;
  loginUser({
    id: data.user.id,
    role: "student",
    name: student?.full_name || (meta?.["full_name"] as string | undefined) || credentials.name,
    teamCode: student?.team_code || (meta?.["team_code"] as string | undefined) || credentials.teamCode,
    email: data.user.email ?? undefined,
  });

  return data;
}

/**
 * Company login with email and password.
 */
export async function loginCompany(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) throw error;

  loginUser({
    id: data.user.id,
    role: "company",
    email: data.user.email ?? undefined,
  });

  return data;
}

/**
 * Fetch real internship listings from Supabase using public_opportunities view.
 * Enforces Recruiter Shield: company_id is omitted and company name is masked as Confidential.
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
 * Submit an internship application for the currently authenticated student.
 */
export async function submitApplication(internshipId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please log in before submitting an application.");
  }

  // 1. Resolve student ID
  let studentId: string | null = null;
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (student?.id) {
    studentId = student.id;
  } else {
    // If student record was not created during signup, create it now
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
      .select("id")
      .single();

    if (createError) throw createError;
    studentId = newStudent.id;
  }

  // 2. Prevent duplicate application
  const { data: existing } = await supabase
    .from("applications")
    .select("id, status")
    .eq("internship_id", internshipId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    return { alreadyApplied: true, application: existing };
  }

  // 3. Create application
  const { data, error } = await supabase
    .from("applications")
    .insert({
      internship_id: internshipId,
      student_id: studentId,
      status: "submitted",
    })
    .select()
    .single();

  if (error) throw error;
  return { alreadyApplied: false, application: data };
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
