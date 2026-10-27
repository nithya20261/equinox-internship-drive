// Entity shapes mirroring the planned backend tables. UUID ids + ISO timestamps.
type Base = { id: string; created_at: string; updated_at: string };

export type UserRole = "student" | "company" | "admin";

export type StudentProfile = Base & {
  user_id: string;
  full_name: string;
  college: string | null;
  branch: string | null;
  graduation_year: number | null;
  skills: string[];
  resume_path: string | null;
  mobile?: string | null;
  team_code?: string | null;
};

export type CompanyProfile = Base & {
  user_id: string;
  name: string;
  industry: string | null;
  company_type: string | null;
  website: string | null;
  about: string | null;
  logo_path: string | null;
};

export type Internship = Base & {
  company_id: string;
  role: string;
  domain: string | null;
  location: string | null;
  mode: "onsite" | "remote" | "hybrid" | null;
  duration: string | null;
  description: string | null;
  responsibilities: string[];
  skills: string[];
  eligibility: string | null;
  status: "draft" | "open" | "closed";
};

export type ApplicationStatus = "submitted" | "under_review" | "shortlisted" | "rejected" | "selected";

export type Application = Base & {
  internship_id: string;
  student_id: string;
  status: ApplicationStatus;
};

export type ScheduleItem = Base & { title: string; starts_at: string; ends_at: string | null; venue: string | null };
export type Faq = Base & { question: string; answer: string; sort_order: number };
export type Announcement = Base & { title: string; body: string; published_at: string | null };
