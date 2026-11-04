import { createFileRoute, Link, type ErrorComponentProps } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { DashboardShell, type DashSection } from "@/components/dashboard/DashboardShell";
import {
  ShieldAlert,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  ExternalLink,
  Users,
  Briefcase,
  FileCheck,
  RefreshCw,
  Sparkles,
  X,
  Download,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Archive,
  Eye,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Container } from "@/components/site/primitives";
import { useAuth } from "@/lib/auth";
import {
  adminGetRoles,
  adminCreateOrUpdateRole,
  adminDeleteRole,
  adminGetConfirmedStudents,
  adminAddConfirmedStudent,
  adminGetApplications,
  adminUpdateApplicationStatus,
  adminGetResumeDownloadUrl,
  adminExportApplicationsCsv,
  adminExportStudentsCsv,
  adminDownloadAllResumesZip,
} from "@/lib/api";
import { INTERNSHIP_CATEGORIES } from "@/data/site";

function AdminErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <Container className="py-20 text-center">
      <div className="mx-auto max-w-lg border border-red-500/30 bg-[#0A0A0A] p-8 text-center rounded-2xl shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-red-500/50 bg-red-950/20 text-red-400 rounded-full">
          <AlertCircle className="h-7 w-7" />
        </div>
        <p className="eyebrow mt-4 text-red-400">Admin Console Error</p>
        <h1 className="headline mt-2 text-2xl text-[#F7F2F6]">
          Unable to Load Admin Console
        </h1>
        <p className="mt-3 text-xs font-mono text-[#F7F2F6]/70 leading-relaxed bg-[#151515] p-3 rounded-lg border border-white/10 text-left overflow-x-auto">
          {(error as any)?.message || "An unexpected error occurred while loading the administrator console."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              reset();
            }}
            className="btn btn-signal text-xs"
          >
            Try again
          </button>
          <Link to="/login" search={{ admin: true }} className="btn btn-line text-xs">
            Admin Login
          </Link>
          <Link to="/" className="btn btn-line text-xs">
            Return to Homepage
          </Link>
        </div>
      </div>
    </Container>
  );
}

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({
    meta: [
      { title: "Organiser console — Internship Drive" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: AdminErrorComponent,
  component: AdminConsole,
});

interface RoleFormData {
  id?: string;
  role: string;
  domain: string;
  location: string;
  mode: string;
  duration: string;
  salary: string;
  status: string;
  description: string;
  responsibilities: string;
  skills: string;
  eligibility: string;
}

const initialRoleForm: RoleFormData = {
  role: "",
  domain: "Artificial Intelligence & Machine Learning",
  location: "MLRIT Campus / Hyderabad",
  mode: "onsite",
  duration: "3 - 6 Months",
  salary: "Commensurate with performance",
  status: "open",
  description: "",
  responsibilities: "",
  skills: "",
  eligibility: "Open to all registered Equinox attendees",
};

function AdminConsole() {
  const { user, isAdmin, loading, login, logout } = useAuth();

  // Roles state
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleFormData>(initialRoleForm);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // Students state
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "premium" | "general" | "has_resume" | "no_resume">("all");
  const [studentSort, setStudentSort] = useState<"date_desc" | "date_asc" | "name_asc" | "name_desc" | "cnf_asc">("date_desc");
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(25);
  const [isExportingStudentsCsv, setIsExportingStudentsCsv] = useState(false);
  const [cnfModalOpen, setCnfModalOpen] = useState(false);
  const [cnfForm, setCnfForm] = useState({
    cnfNumber: "",
    fullName: "",
    college: "MLR Institute of Technology",
    mobile: "",
  });
  const [isSavingCnf, setIsSavingCnf] = useState(false);
  const [cnfError, setCnfError] = useState<string | null>(null);
  const [cnfSuccess, setCnfSuccess] = useState<string | null>(null);

  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; filename: string } | null>(null);
  const [selectedAppModal, setSelectedAppModal] = useState<any | null>(null);
  const [appOperationMsg, setAppOperationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Data loading error states
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);

  const isAuthorized = isAdmin && user?.role === "admin";

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      setRolesError(null);
      const data = await adminGetRoles();
      setRoles(data || []);
    } catch (err: any) {
      console.warn("Error loading admin roles:", err);
      setRolesError(err?.message || "Failed to load internship roles from database.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      setStudentsError(null);
      const res = await adminGetConfirmedStudents();
      setDbStudents(res?.dbStudents || []);
    } catch (err: any) {
      console.warn("Error loading confirmed students:", err);
      setStudentsError(err?.message || "Failed to load confirmed students from database.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      setAppsError(null);
      const data = await adminGetApplications();
      setApplications(data || []);
    } catch (err: any) {
      console.warn("Error loading applications:", err);
      setAppsError(err?.message || "Failed to load candidate applications from database.");
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchRoles();
      fetchStudents();
      fetchApplications();
    }
  }, [isAuthorized]);

  // Reset page when filter or search changes
  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch, studentFilter, studentPageSize]);

  // --- Students Filter & Sort & Pagination Logic (Top-level hooks before conditional returns) ---
  const processedStudents = useMemo(() => {
    let list = [...dbStudents];

    // Filter by category
    if (studentFilter === "premium") {
      list = list.filter((s) => s.is_premium_pass === true);
    } else if (studentFilter === "general") {
      list = list.filter((s) => s.is_premium_pass !== true);
    } else if (studentFilter === "has_resume") {
      list = list.filter((s) => Boolean(s.resume_url));
    } else if (studentFilter === "no_resume") {
      list = list.filter((s) => !s.resume_url);
    }

    // Search
    const q = studentSearch.toLowerCase().trim();
    if (q) {
      list = list.filter((s) => {
        const name = (s.full_name || "").toLowerCase();
        const cnf = (s.cnf_number || s.team_code || "").toLowerCase();
        const email = (s.email || "").toLowerCase();
        const mobile = (s.mobile || "").toLowerCase();
        const college = (s.college || "").toLowerCase();
        const branch = (s.branch || "").toLowerCase();
        return (
          name.includes(q) ||
          cnf.includes(q) ||
          email.includes(q) ||
          mobile.includes(q) ||
          college.includes(q) ||
          branch.includes(q)
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (studentSort === "date_desc") {
        const tA = new Date(a.created_at || a.registration_date || 0).getTime();
        const tB = new Date(b.created_at || b.registration_date || 0).getTime();
        return tB - tA;
      }
      if (studentSort === "date_asc") {
        const tA = new Date(a.created_at || a.registration_date || 0).getTime();
        const tB = new Date(b.created_at || b.registration_date || 0).getTime();
        return tA - tB;
      }
      if (studentSort === "name_asc") {
        return (a.full_name || "").localeCompare(b.full_name || "");
      }
      if (studentSort === "name_desc") {
        return (b.full_name || "").localeCompare(a.full_name || "");
      }
      if (studentSort === "cnf_asc") {
        return (a.cnf_number || a.team_code || "").localeCompare(b.cnf_number || b.team_code || "");
      }
      return 0;
    });

    return list;
  }, [dbStudents, studentFilter, studentSearch, studentSort]);

  const totalStudentPages = Math.ceil(processedStudents.length / studentPageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * studentPageSize;
    return processedStudents.slice(start, start + studentPageSize);
  }, [processedStudents, studentPage, studentPageSize]);

  // --- Filtered Applications (Top-level hook before conditional returns) ---
  const filteredApps = useMemo(() => {
    let list = [...applications];

    if (appStatusFilter !== "all") {
      list = list.filter((a) => (a.status || "submitted").toLowerCase() === appStatusFilter.toLowerCase());
    }

    const q = appSearch.toLowerCase().trim();
    if (q) {
      list = list.filter((app) => {
        const sName = (app.student?.full_name || app.student_name || "").toLowerCase();
        const sCnf = (app.student?.team_code || app.cnf_number || "").toLowerCase();
        const sEmail = (app.student?.email || app.student_email || "").toLowerCase();
        const sPhone = (app.student?.mobile || app.student_phone || "").toLowerCase();
        const rRole = (app.internship?.role || app.role_title || "").toLowerCase();
        const rDomain = (app.internship?.domain || "").toLowerCase();
        const skills = (app.skills || "").toLowerCase();
        return (
          sName.includes(q) ||
          sCnf.includes(q) ||
          sEmail.includes(q) ||
          sPhone.includes(q) ||
          rRole.includes(q) ||
          rDomain.includes(q) ||
          skills.includes(q)
        );
      });
    }

    return list;
  }, [applications, appStatusFilter, appSearch]);

  if (loading) {
    return (
      <Container className="py-20 text-center">
        <p className="font-mono text-xs text-[#7484FE]">Verifying administrator credentials...</p>
      </Container>
    );
  }

  if (!isAuthorized) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-md border border-[#2A2A2A] bg-[#0A0A0A] p-8 md:p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[#7484FE] bg-black text-[#7484FE]">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <p className="eyebrow mt-6 text-[#7484FE]">Restricted System</p>
          <h1 className="headline mt-2 text-3xl md:text-4xl text-[#F7F2F6]">
            Organiser Console Access
          </h1>
          <p className="mt-3 text-xs text-[#F7F2F6]/60 leading-relaxed">
            This area is strictly restricted to verified CIE administrators. Please log in with your administrator credentials.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link to="/login" search={{ admin: true }} className="btn btn-signal w-full">
              Log in as Administrator
            </Link>

            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => {
                  login({
                    id: "dev-admin-id",
                    role: "admin",
                    email: "equinoxcie@admin.equinox.internal",
                    name: "CIE Administrator (Dev Mode)",
                  });
                }}
                className="btn btn-line w-full text-xs font-mono text-[#33FF67] border-[#33FF67]/40 hover:bg-[#33FF67]/10"
              >
                ⚡ Development Mode: Open Admin Console
              </button>
            )}
          </div>

          <div className="mt-6 border-t border-[#2A2A2A] pt-4">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-[#F7F2F6]/50 hover:text-[#33FF67]">
              <ArrowLeft size={12} /> Return to homepage
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // --- Role Handlers ---
  const handleOpenAddRole = () => {
    setRoleForm(initialRoleForm);
    setRoleError(null);
    setRoleSuccess(null);
    setRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: any) => {
    const skillsStr = Array.isArray(role.skills)
      ? role.skills.join(", ")
      : role.skills || "";
    const respStr = Array.isArray(role.responsibilities)
      ? role.responsibilities.join("\n")
      : role.responsibilities || "";

    setRoleForm({
      id: role.id,
      role: role.role || "",
      domain: role.domain || "Artificial Intelligence & Machine Learning",
      location: role.location || "MLRIT Campus / Hyderabad",
      mode: role.mode || "onsite",
      duration: role.duration || "3 - 6 Months",
      salary: role.salary || "Commensurate with performance",
      status: role.status || "open",
      description: role.description || "",
      responsibilities: respStr,
      skills: skillsStr,
      eligibility: role.eligibility || "Open to all registered Equinox attendees",
    });
    setRoleError(null);
    setRoleSuccess(null);
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e: FormEvent) => {
    e.preventDefault();
    setRoleError(null);
    setRoleSuccess(null);

    if (!roleForm.role.trim()) {
      setRoleError("Role title is required.");
      return;
    }
    if (!roleForm.domain.trim()) {
      setRoleError("Domain category is required.");
      return;
    }

    try {
      setIsSavingRole(true);

      const parsedSkills = roleForm.skills
        .split(/[,•\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedResponsibilities = roleForm.responsibilities
        .split("\n")
        .map((r) => r.trim().replace(/^[-*•]\s*/, ""))
        .filter(Boolean);

      await adminCreateOrUpdateRole({
        id: roleForm.id,
        role: roleForm.role.trim(),
        domain: roleForm.domain.trim(),
        location: roleForm.location.trim(),
        mode: roleForm.mode,
        duration: roleForm.duration.trim(),
        salary: roleForm.salary.trim(),
        status: roleForm.status,
        description: roleForm.description.trim(),
        responsibilities: parsedResponsibilities,
        skills: parsedSkills,
        eligibility: roleForm.eligibility.trim(),
      });

      setRoleSuccess(
        roleForm.id ? "Role updated successfully!" : "New role created and published successfully!"
      );
      await fetchRoles();
      setTimeout(() => {
        setRoleModalOpen(false);
        setRoleSuccess(null);
      }, 1200);
    } catch (err: any) {
      setRoleError(err?.message || "Failed to save internship role.");
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRole = async (id: string, roleName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${roleName}"? All candidate applications for this role will also be removed.`)) {
      return;
    }

    try {
      setDeletingRoleId(id);
      await adminDeleteRole(id);
      await fetchRoles();
    } catch (err: any) {
      alert(`Could not delete role: ${err?.message || "Unknown error"}`);
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleToggleStatus = async (role: any) => {
    const newStatus = role.status === "open" ? "closed" : "open";
    try {
      await adminCreateOrUpdateRole({
        id: role.id,
        role: role.role,
        domain: role.domain,
        status: newStatus,
      });
      await fetchRoles();
    } catch (err: any) {
      alert(`Could not toggle status: ${err?.message}`);
    }
  };

  // --- CNF Handlers ---
  const handleGenerateCnf = () => {
    const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
    setCnfForm((prev) => ({ ...prev, cnfNumber: `CNF-${hex}` }));
  };

  const handleSaveCnf = async (e: FormEvent) => {
    e.preventDefault();
    setCnfError(null);
    setCnfSuccess(null);

    if (!cnfForm.cnfNumber.trim()) {
      setCnfError("CNF Number is required.");
      return;
    }
    if (!cnfForm.fullName.trim()) {
      setCnfError("Student Full Name is required.");
      return;
    }

    try {
      setIsSavingCnf(true);
      const res = await adminAddConfirmedStudent({
        cnfNumber: cnfForm.cnfNumber.trim(),
        fullName: cnfForm.fullName.trim(),
        college: cnfForm.college.trim(),
        mobile: cnfForm.mobile.trim(),
      });

      setCnfSuccess(
        `CNF Access Granted! Student ${res.name} can now log in using CNF: ${res.cnf} (Password: ${res.cnf}).`
      );
      await fetchStudents();
      setCnfForm({
        cnfNumber: "",
        fullName: "",
        college: "MLR Institute of Technology",
        mobile: "",
      });
    } catch (err: any) {
      setCnfError(err?.message || "Failed to add CNF student access.");
    } finally {
      setIsSavingCnf(false);
    }
  };

  // --- Students Export ---
  const handleExportStudentsCsv = async () => {
    try {
      setIsExportingStudentsCsv(true);
      setAppOperationMsg(null);
      const res = await adminExportStudentsCsv();
      setAppOperationMsg({
        type: "success",
        text: `Successfully exported ${res.count} student registration record(s) to CSV.`,
      });
      setTimeout(() => setAppOperationMsg(null), 4000);
    } catch (err: any) {
      setAppOperationMsg({
        type: "error",
        text: err?.message || "Failed to export students CSV.",
      });
    } finally {
      setIsExportingStudentsCsv(false);
    }
  };

  // --- Applications Handlers ---
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(applicationId);
      setAppOperationMsg(null);
      await adminUpdateApplicationStatus(applicationId, newStatus);
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
      setAppOperationMsg({
        type: "success",
        text: `Application status updated to "${newStatus.replace(/_/g, " ").toUpperCase()}".`,
      });
      setTimeout(() => setAppOperationMsg(null), 3500);
    } catch (err: any) {
      setAppOperationMsg({
        type: "error",
        text: err?.message || "Failed to update application status.",
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleViewResume = async (appId: string, resumeUrl?: string | null) => {
    if (!resumeUrl) {
      alert("No resume file path attached to this application.");
      return;
    }
    try {
      setDownloadingResumeId(appId);
      const signedUrl = await adminGetResumeDownloadUrl(resumeUrl);
      if (signedUrl) {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      } else {
        alert("Resume file could not be accessed or link has expired.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to generate resume download link.");
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      setAppOperationMsg(null);
      const res = await adminExportApplicationsCsv();
      setAppOperationMsg({
        type: "success",
        text: `Exported ${res.count} candidate application(s) to CSV file.`,
      });
      setTimeout(() => setAppOperationMsg(null), 4000);
    } catch (err: any) {
      setAppOperationMsg({
        type: "error",
        text: err?.message || "Failed to export applications to CSV.",
      });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleDownloadAllResumesZip = async () => {
    if (applications.length === 0) return;
    try {
      setIsDownloadingZip(true);
      setZipProgress(null);
      setAppOperationMsg(null);
      const res = await adminDownloadAllResumesZip(applications, (prog: any) => {
        setZipProgress(prog);
      });
      setAppOperationMsg({
        type: "success",
        text: `CV Archive complete: ${res.downloadedCount} CV(s) downloaded into ZIP${res.missingCount > 0 ? ` (${res.missingCount} missing from storage)` : ""}.`,
      });
      setTimeout(() => setAppOperationMsg(null), 5000);
    } catch (err: any) {
      setAppOperationMsg({
        type: "error",
        text: err?.message || "Failed to download resume ZIP archive.",
      });
    } finally {
      setIsDownloadingZip(false);
      setZipProgress(null);
    }
  };

  const allCategories = [
    ...INTERNSHIP_CATEGORIES.technical,
    ...INTERNSHIP_CATEGORIES.nonTechnical,
  ];

  // --- Dynamic Content Sections ---
  const sections: DashSection[] = [
    {
      key: "internships",
      label: `Internship Roles (${roles.length})`,
      empty: "No internship listings yet. Add a role below.",
      content: (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/20 bg-[#151515] p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#33FF67] animate-pulse" />
                <h3 className="font-mono text-sm font-bold text-[#F7F2F6] uppercase tracking-wider">
                  Live Internship Directory
                </h3>
              </div>
              <p className="mt-1 text-xs text-[#F7F2F6]/60">
                {roles.length} active listings published to candidates. Recruiters are masked under Recruiter Shield protocol.
              </p>
            </div>

            <button
              onClick={handleOpenAddRole}
              className="btn btn-signal flex items-center gap-2 px-4 py-2.5 text-xs font-bold"
            >
              <Plus size={16} /> Add New Role
            </button>
          </div>

          {rolesError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-xs font-mono text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{rolesError}</span>
              </div>
              <button
                type="button"
                onClick={fetchRoles}
                className="btn btn-line h-8 px-3 text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Roles Grid / Table */}
          {loadingRoles ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#33FF67]" />
            </div>
          ) : roles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-white/30" />
              <h4 className="mt-3 text-lg font-bold text-[#F7F2F6]">No Internship Roles</h4>
              <p className="mt-1 text-xs text-[#F7F2F6]/60">
                All mock roles were removed. Click "Add New Role" to create your first dynamic role.
              </p>
              <button
                onClick={handleOpenAddRole}
                className="btn btn-signal mt-5 inline-flex items-center gap-2 text-xs"
              >
                <Plus size={14} /> Add First Role
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {roles.map((r, idx) => {
                const appCount = r.applications?.[0]?.count ?? 0;
                const skills = Array.isArray(r.skills)
                  ? r.skills
                  : typeof r.skills === "string"
                  ? r.skills.split(/[,•]/).map((s: string) => s.trim()).filter(Boolean)
                  : [];

                return (
                  <div
                    key={r.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-white/15 bg-[#181818] p-5 transition hover:border-[#7484FE]/70"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#7484FE]">
                          #{String(idx + 1).padStart(2, "0")}
                        </span>
                        <h4 className="font-sans text-base sm:text-lg font-bold text-[#F7F2F6]">
                          {r.role}
                        </h4>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                            r.status === "open"
                              ? "bg-[#33FF67]/15 text-[#33FF67] border border-[#33FF67]/30"
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {r.status || "open"}
                        </span>
                        <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/80">
                          {r.mode}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[#F7F2F6]/60">
                        <span>Domain: <strong className="text-white">{r.domain}</strong></span>
                        <span>Location: <strong className="text-white">{r.location}</strong></span>
                        <span>Duration: <strong className="text-white">{r.duration || "3 - 6 Mo"}</strong></span>
                        <span>Applications: <strong className="text-[#33FF67]">{appCount}</strong></span>
                      </div>

                      {r.description && (
                        <p className="line-clamp-2 text-xs text-[#F7F2F6]/75">
                          {r.description}
                        </p>
                      )}

                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {skills.map((sk: string, i: number) => (
                            <span
                              key={i}
                              className="rounded border border-white/10 bg-[#121212] px-2 py-0.5 font-mono text-[10px] text-white/70"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 border-white/10 pt-3 lg:pt-0">
                      <button
                        onClick={() => handleToggleStatus(r)}
                        className={`btn h-8 px-3 text-xs font-mono font-medium ${
                          r.status === "open"
                            ? "border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                            : "border border-[#33FF67]/30 text-[#33FF67] hover:bg-[#33FF67]/10"
                        }`}
                        title="Toggle Open/Closed"
                      >
                        {r.status === "open" ? "Close" : "Re-open"}
                      </button>

                      <button
                        onClick={() => handleOpenEditRole(r)}
                        className="btn btn-line h-8 px-3 text-xs font-mono flex items-center gap-1.5"
                      >
                        <Edit2 size={13} /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteRole(r.id, r.role)}
                        disabled={deletingRoleId === r.id}
                        className="btn border border-red-500/40 bg-red-950/20 text-red-400 hover:bg-red-900/40 h-8 px-2.5 text-xs font-mono disabled:opacity-50"
                        title="Delete Role"
                      >
                        {deletingRoleId === r.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>

                      <Link
                        to="/internships/$id"
                        params={{ id: r.id }}
                        target="_blank"
                        className="btn border border-white/20 text-white/80 hover:text-white h-8 px-2.5"
                        title="View Live Page"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "students",
      label: `Registered Students (${dbStudents.length})`,
      empty: "Registered candidate records from Supabase will appear here.",
      content: (
        <div className="space-y-6">
          {/* Header Banner & Global Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/20 bg-[#151515] p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#33FF67]" />
                <h3 className="font-mono text-sm font-bold text-[#F7F2F6] uppercase tracking-wider">
                  Live Supabase Student Registrations
                </h3>
              </div>
              <p className="mt-1 text-xs text-[#F7F2F6]/60">
                <strong>{dbStudents.length}</strong> registered students loaded from Supabase. {dbStudents.filter(s => s.is_premium_pass).length} hold verified Premium Passes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchStudents}
                disabled={loadingStudents}
                className="btn btn-line h-9 px-3 text-xs font-mono inline-flex items-center gap-1.5"
                title="Refresh student records from Supabase"
              >
                <RefreshCw size={13} className={loadingStudents ? "animate-spin text-[#33FF67]" : ""} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportStudentsCsv}
                disabled={isExportingStudentsCsv || dbStudents.length === 0}
                className="btn btn-signal h-9 px-4 text-xs font-mono inline-flex items-center gap-2"
              >
                {isExportingStudentsCsv ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Export Students CSV ({dbStudents.length})</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setCnfModalOpen(true);
                  setCnfError(null);
                  setCnfSuccess(null);
                }}
                className="btn border border-[#7484FE]/40 bg-[#7484FE]/10 text-[#7484FE] hover:bg-[#7484FE]/20 h-9 px-3.5 text-xs font-mono font-bold inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Add CNF
              </button>
            </div>
          </div>

          {studentsError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-xs font-mono text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{studentsError}</span>
              </div>
              <button
                type="button"
                onClick={fetchStudents}
                className="btn btn-line h-8 px-3 text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search, Filter, Sort and Page-size toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by full name, CNF number, email, mobile, college, branch..."
                className="w-full rounded-xl border border-white/20 bg-[#121212] py-2.5 pl-10 pr-9 font-mono text-xs text-white placeholder:text-white/40 outline-none focus:border-[#7484FE]"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={14} className="text-white/50" />
              <select
                aria-label="Filter students by status"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value as any)}
                className="rounded-xl border border-white/20 bg-[#121212] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#7484FE] cursor-pointer"
              >
                <option value="all">All Registrations ({dbStudents.length})</option>
                <option value="premium">Verified Premium Pass ({dbStudents.filter(s => s.is_premium_pass).length})</option>
                <option value="general">General / Unverified ({dbStudents.filter(s => !s.is_premium_pass).length})</option>
                <option value="has_resume">With Resume on File ({dbStudents.filter(s => Boolean(s.resume_url)).length})</option>
                <option value="no_resume">Without Resume ({dbStudents.filter(s => !s.resume_url).length})</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown size={14} className="text-white/50" />
              <select
                aria-label="Sort students list"
                value={studentSort}
                onChange={(e) => setStudentSort(e.target.value as any)}
                className="rounded-xl border border-white/20 bg-[#121212] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#7484FE] cursor-pointer"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name (A → Z)</option>
                <option value="name_desc">Name (Z → A)</option>
                <option value="cnf_asc">CNF Number</option>
              </select>
            </div>

            {/* Page Size Selector */}
            <div className="shrink-0">
              <select
                aria-label="Items per page"
                value={studentPageSize}
                onChange={(e) => setStudentPageSize(Number(e.target.value))}
                className="rounded-xl border border-white/20 bg-[#121212] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#7484FE] cursor-pointer"
              >
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          {loadingStudents ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#33FF67]" />
            </div>
          ) : paginatedStudents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 p-12 text-center text-white/50 text-xs font-mono">
              No student registration records match the current filter and search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/15 bg-[#181818]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="border-b border-white/15 bg-[#121212] font-mono text-[11px] text-[#7484FE] uppercase">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Candidate & Email</th>
                    <th className="px-4 py-3">CNF Number</th>
                    <th className="px-4 py-3">Pass Verification</th>
                    <th className="px-4 py-3">Institution & Branch</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Registration Date</th>
                    <th className="px-4 py-3">Resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 font-mono">
                  {paginatedStudents.map((s, idx) => {
                    const rowNumber = (studentPage - 1) * studentPageSize + idx + 1;
                    const dateFormatted = s.created_at || s.registration_date
                      ? new Date(s.created_at || s.registration_date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";

                    return (
                      <tr key={s.id || s.user_id || idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white/40">{rowNumber}</td>
                        <td className="px-4 py-3">
                          <div className="font-sans font-bold text-white text-xs">
                            {s.full_name || "Applicant"}
                          </div>
                          {s.email && (
                            <div className="font-mono text-[11px] text-white/50 truncate max-w-[200px]" title={s.email}>
                              {s.email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#33FF67] tracking-wider">
                          {s.cnf_number || s.team_code || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {s.is_premium_pass ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#33FF67]/30 bg-[#33FF67]/10 px-2 py-0.5 text-[10px] font-bold text-[#33FF67]">
                              <ShieldCheck size={11} /> Verified Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              General / Unverified
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-sans text-white/80">
                          <div className="truncate max-w-[180px]" title={s.college}>
                            {s.college || "MLRIT"}
                          </div>
                          {(s.branch || s.course_branch) && (
                            <div className="text-[11px] text-white/50 truncate max-w-[180px]">
                              {s.branch || s.course_branch}
                              {s.graduation_year ? ` ('${String(s.graduation_year).slice(-2)})` : ""}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/70">
                          {s.mobile && s.mobile !== "N/A" ? s.mobile : "—"}
                        </td>
                        <td className="px-4 py-3 text-white/60 text-[11px]">
                          {dateFormatted}
                        </td>
                        <td className="px-4 py-3">
                          {s.resume_url ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#33FF67]" title={s.resume_url}>
                              <FileCheck size={12} /> On File
                            </span>
                          ) : (
                            <span className="text-[11px] text-white/30">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 bg-[#121212] px-4 py-3 font-mono text-xs">
                <span className="text-white/50">
                  Showing {(studentPage - 1) * studentPageSize + 1} to{" "}
                  {Math.min(studentPage * studentPageSize, processedStudents.length)} of{" "}
                  {processedStudents.length} students
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={studentPage <= 1}
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    className="btn btn-line h-8 px-2.5 text-xs disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span className="text-white/80 px-2">
                    Page <strong>{studentPage}</strong> of <strong>{totalStudentPages}</strong>
                  </span>

                  <button
                    type="button"
                    disabled={studentPage >= totalStudentPages}
                    onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                    className="btn btn-line h-8 px-2.5 text-xs disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "applications",
      label: `Candidate Applications (${applications.length})`,
      empty: "Candidate applications submitted for internship roles will appear here.",
      content: (
        <div className="space-y-6">
          {/* Header Banner & Global Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/20 bg-[#151515] p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#33FF67] animate-pulse" />
                <h3 className="font-mono text-sm font-bold text-[#F7F2F6] uppercase tracking-wider">
                  Candidate Applications Live Feed
                </h3>
              </div>
              <p className="mt-1 text-xs text-[#F7F2F6]/60">
                <strong>{applications.length}</strong> total application(s) across roles. Multi-role submissions are tracked independently.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={fetchApplications}
                disabled={loadingApps}
                className="btn btn-line h-9 px-3 text-xs font-mono inline-flex items-center gap-1.5"
                title="Refresh application feed"
              >
                <RefreshCw size={13} className={loadingApps ? "animate-spin text-[#33FF67]" : ""} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                disabled={isDownloadingZip || applications.length === 0}
                onClick={handleDownloadAllResumesZip}
                className="btn border border-[#7484FE]/40 bg-[#7484FE]/10 text-[#7484FE] hover:bg-[#7484FE]/20 h-9 px-3.5 text-xs font-mono font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
                title="Download all candidate resumes bundled into a single ZIP file"
              >
                {isDownloadingZip ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>
                      {zipProgress ? `Bundling ${zipProgress.current}/${zipProgress.total}...` : "Creating ZIP..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Archive size={14} />
                    <span>Download All CVs (ZIP)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isExportingCsv || applications.length === 0}
                onClick={handleExportCsv}
                className="btn btn-signal h-9 px-4 text-xs font-mono inline-flex items-center gap-2"
              >
                {isExportingCsv ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Export Applications CSV ({filteredApps.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {appsError && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-xs font-mono text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{appsError}</span>
              </div>
              <button
                type="button"
                onClick={fetchApplications}
                className="btn btn-line h-8 px-3 text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Operation notification banner */}
          {appOperationMsg && (
            <div
              className={`flex items-center gap-2 rounded-xl border p-3.5 font-mono text-xs ${
                appOperationMsg.type === "success"
                  ? "border-[#33FF67]/40 bg-[#33FF67]/10 text-[#33FF67]"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
              }`}
            >
              {appOperationMsg.type === "success" ? (
                <CheckCircle2 size={15} className="shrink-0" />
              ) : (
                <AlertCircle size={15} className="shrink-0" />
              )}
              <span>{appOperationMsg.text}</span>
            </div>
          )}

          {/* Search bar & Status Filter Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search by candidate name, CNF, email, phone, role, domain, or skills..."
                className="w-full rounded-xl border border-white/20 bg-[#121212] py-2.5 pl-10 pr-4 font-mono text-xs text-white placeholder:text-white/40 outline-none focus:border-[#7484FE]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter size={14} className="text-white/50" />
              <select
                aria-label="Filter applications by status"
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="rounded-xl border border-white/20 bg-[#121212] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#7484FE] cursor-pointer"
              >
                <option value="all">All Statuses ({applications.length})</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loadingApps ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#33FF67]" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 p-12 text-center text-white/50 text-xs font-mono">
              No candidate applications match the selected status and search criteria.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredApps.map((app) => {
                const sName = app.student?.full_name || app.student_name || "Applicant";
                const sCnf = app.student?.team_code || app.cnf_number || "CNF";
                const sEmail = app.student?.email || app.student_email || "";
                const sPhone = app.student?.mobile || app.student_phone || "";
                const rRole = app.internship?.role || app.role_title || "Internship Role";
                const rDomain = app.internship?.domain || "General";
                const college = app.student?.college || app.college || "MLRIT";
                const branch = app.student?.course_branch || app.course_branch || "";
                const gradYear = app.student?.graduation_year || "";
                const isResumeAvailable = app.resume_status === "available" || Boolean(app.resume_download_url || app.resume_url);

                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-white/15 bg-[#181818] p-5 flex flex-col md:flex-row md:items-start justify-between gap-5 hover:border-white/25 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#33FF67]">
                          {sCnf}
                        </span>
                        <strong className="text-white font-sans text-sm">
                          {sName}
                        </strong>
                        {sEmail && (
                          <span className="font-mono text-[11px] text-white/50">
                            ({sEmail})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#7484FE] font-mono">
                        Applied for: <strong>{rRole}</strong> ({rDomain})
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/70 font-sans">
                        <span>College: <strong>{college}</strong></span>
                        {branch && (
                          <>
                            <span>•</span>
                            <span>Branch: <strong>{branch}</strong></span>
                          </>
                        )}
                        {gradYear && (
                          <>
                            <span>•</span>
                            <span>Grad Year: <strong>{gradYear}</strong></span>
                          </>
                        )}
                        {sPhone && sPhone !== "N/A" && (
                          <>
                            <span>•</span>
                            <span>Mobile: <strong>{sPhone}</strong></span>
                          </>
                        )}
                        {app.availability && (
                          <>
                            <span>•</span>
                            <span className="text-[#33FF67]">Availability: {app.availability}</span>
                          </>
                        )}
                      </div>

                      {app.skills && (
                        <p className="text-[11px] text-white/60 font-mono mt-1">
                          Skills: <span className="text-white/80">{app.skills}</span>
                        </p>
                      )}

                      {app.created_at && (
                        <p className="text-[10px] text-white/40 font-mono">
                          Submitted: {new Date(app.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-3 shrink-0">
                      {/* Status Dropdown Selector */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase text-white/50">Status:</span>
                        <select
                          aria-label="Update Application Status"
                          value={app.status || "submitted"}
                          disabled={updatingStatusId === app.id}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className={`rounded-lg border px-3 py-1 font-mono text-xs font-bold uppercase outline-none transition-colors cursor-pointer ${
                            app.status === "selected"
                              ? "border-[#33FF67] bg-[#33FF67]/15 text-[#33FF67]"
                              : app.status === "shortlisted"
                              ? "border-[#7484FE] bg-[#7484FE]/15 text-[#7484FE]"
                              : app.status === "interview_scheduled"
                              ? "border-amber-400 bg-amber-400/15 text-amber-300"
                              : app.status === "under_review"
                              ? "border-sky-400 bg-sky-400/15 text-sky-300"
                              : app.status === "rejected"
                              ? "border-red-500/50 bg-red-500/10 text-red-400"
                              : "border-white/20 bg-[#121212] text-white/80"
                          }`}
                        >
                          <option value="submitted" className="bg-[#181818] text-white">Submitted</option>
                          <option value="under_review" className="bg-[#181818] text-sky-300">Under Review</option>
                          <option value="shortlisted" className="bg-[#181818] text-[#7484FE]">Shortlisted</option>
                          <option value="interview_scheduled" className="bg-[#181818] text-amber-300">Interview Scheduled</option>
                          <option value="selected" className="bg-[#181818] text-[#33FF67]">Selected</option>
                          <option value="rejected" className="bg-[#181818] text-red-400">Rejected</option>
                        </select>
                        {updatingStatusId === app.id && (
                          <Loader2 size={13} className="animate-spin text-[#33FF67]" />
                        )}
                      </div>

                      {/* Action Links & Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {app.video_url && (
                          <a
                            href={app.video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-line h-8 px-2.5 text-xs font-mono inline-flex items-center gap-1 hover:border-[#7484FE] hover:text-[#7484FE]"
                            title="Open One-Minute Self-Introduction Video"
                          >
                            Video <ExternalLink size={11} />
                          </a>
                        )}

                        {app.portfolio_url && (
                          <a
                            href={app.portfolio_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-line h-8 px-2.5 text-xs font-mono inline-flex items-center gap-1"
                            title="Open Portfolio / GitHub Link"
                          >
                            Portfolio <ExternalLink size={11} />
                          </a>
                        )}

                        {isResumeAvailable ? (
                          <button
                            type="button"
                            disabled={downloadingResumeId === app.id}
                            onClick={() => handleViewResume(app.id, app.resume_download_url || app.resume_url)}
                            className="btn btn-line h-8 px-2.5 text-xs font-mono inline-flex items-center gap-1.5 hover:border-[#33FF67] hover:text-[#33FF67]"
                            title="Open candidate resume securely"
                          >
                            {downloadingResumeId === app.id ? (
                              <>
                                <Loader2 size={12} className="animate-spin text-[#33FF67]" />
                                <span>Opening...</span>
                              </>
                            ) : (
                              <>
                                <FileText size={12} className="text-[#33FF67]" />
                                <span>Download CV</span>
                                <ExternalLink size={11} className="opacity-60" />
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-400">
                            CV Missing
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedAppModal(app)}
                          className="btn border border-white/20 text-white/80 hover:text-white h-8 px-2.5 text-xs font-mono inline-flex items-center gap-1"
                          title="View all submitted candidate answers"
                        >
                          <Eye size={12} />
                          <span>All Answers</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="relative">
      {/* Top Banner */}
      <div className="bg-black border-b border-[#2A2A2A] px-6 py-2.5 flex items-center justify-between text-xs font-mono text-[#F7F2F6]/75">
        <span className="flex items-center gap-2 text-[#33FF67]">
          <span className="h-2 w-2 rounded-full bg-[#33FF67]" />
          Authenticated: CIE Lead Administrator ({user?.email})
        </span>
        <button
          onClick={() => {
            logout();
            window.location.href = "/login?admin=1";
          }}
          className="text-[#7484FE] hover:underline"
        >
          Sign out
        </button>
      </div>

      <DashboardShell role="Organiser" sections={sections} />

      {/* --- Full Application Details & Answers Modal --- */}
      {selectedAppModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-white/20 bg-[#161616] p-6 text-[#F7F2F6] shadow-2xl md:p-8">
            <button
              onClick={() => setSelectedAppModal(null)}
              className="absolute right-4 top-4 text-[#F7F2F6]/60 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mb-5 border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold text-[#33FF67] uppercase tracking-wider">
                Full Application Dossier
              </span>
              <h2 className="headline mt-1 text-2xl text-[#F7F2F6]">
                {selectedAppModal.student?.full_name || selectedAppModal.student_name || "Applicant"}
              </h2>
              <div className="mt-1 font-mono text-xs text-[#7484FE]">
                {selectedAppModal.internship?.role || selectedAppModal.role_title || "Internship"} • {selectedAppModal.internship?.domain || "General"}
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-white/10 bg-[#121212] p-4 font-mono">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Confirmation (CNF)</span>
                  <span className="text-[#33FF67] font-bold text-sm">
                    {selectedAppModal.student?.team_code || selectedAppModal.cnf_number || "CNF"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Application Status</span>
                  <span className="text-white uppercase font-bold">
                    {selectedAppModal.status || "submitted"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Email</span>
                  <span className="text-white">
                    {selectedAppModal.student?.email || selectedAppModal.student_email || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Phone / Contact</span>
                  <span className="text-white">
                    {selectedAppModal.student?.mobile || selectedAppModal.student_phone || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Institution</span>
                  <span className="text-white font-sans">
                    {selectedAppModal.student?.college || selectedAppModal.college || "MLRIT"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Course & Branch</span>
                  <span className="text-white font-sans">
                    {selectedAppModal.student?.course_branch || selectedAppModal.course_branch || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Availability</span>
                  <span className="text-[#33FF67]">
                    {selectedAppModal.availability || "Immediate"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Submission Date</span>
                  <span className="text-white/70">
                    {selectedAppModal.created_at
                      ? new Date(selectedAppModal.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
                <span className="text-white/40 block text-[10px] uppercase font-mono mb-1">Relevant Skills</span>
                <p className="text-white font-mono text-xs">
                  {selectedAppModal.skills || "Not specified"}
                </p>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedAppModal.video_url && (
                  <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
                    <span className="text-white/40 block text-[10px] uppercase font-mono mb-1">
                      Self-Introduction Video Link
                    </span>
                    <a
                      href={selectedAppModal.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#7484FE] hover:underline inline-flex items-center gap-1 font-mono text-xs break-all"
                    >
                      {selectedAppModal.video_url} <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </div>
                )}

                {selectedAppModal.portfolio_url && (
                  <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
                    <span className="text-white/40 block text-[10px] uppercase font-mono mb-1">
                      Portfolio / Profile URL
                    </span>
                    <a
                      href={selectedAppModal.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#7484FE] hover:underline inline-flex items-center gap-1 font-mono text-xs break-all"
                    >
                      {selectedAppModal.portfolio_url} <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Resume Path & Action */}
              <div className="rounded-xl border border-white/10 bg-[#121212] p-4 flex items-center justify-between gap-4 font-mono">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Resume Storage Path</span>
                  <span className="text-white/80 text-xs break-all">
                    {selectedAppModal.resume_url || "No resume path provided"}
                  </span>
                </div>
                {selectedAppModal.resume_url && (
                  <button
                    type="button"
                    onClick={() => handleViewResume(selectedAppModal.id, selectedAppModal.resume_url)}
                    className="btn btn-signal h-8 px-3 text-xs shrink-0 inline-flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Download CV</span>
                  </button>
                )}
              </div>

              {/* Extra Submitted Answers (from JSON answers column) */}
              {selectedAppModal.answers && typeof selectedAppModal.answers === "object" && Object.keys(selectedAppModal.answers).length > 0 && (
                <div className="rounded-xl border border-white/10 bg-[#121212] p-4 space-y-2">
                  <span className="text-white/40 block text-[10px] uppercase font-mono mb-2">
                    Submitted Application Answers
                  </span>
                  <div className="space-y-2 font-mono text-xs">
                    {Object.entries(selectedAppModal.answers).map(([k, v]) => (
                      <div key={k} className="border-b border-white/5 pb-2">
                        <span className="text-[#7484FE] block text-[11px] font-semibold">{k}:</span>
                        <span className="text-white/80 font-sans">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setSelectedAppModal(null)}
                className="btn btn-line px-5 text-xs font-mono"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Role Create / Edit Modal --- */}
      {roleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-white/20 bg-[#161616] p-6 text-[#F7F2F6] shadow-2xl md:p-8">
            <button
              onClick={() => setRoleModalOpen(false)}
              className="absolute right-4 top-4 text-[#F7F2F6]/60 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mb-5 border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold text-[#7484FE] uppercase tracking-wider">
                {roleForm.id ? "Edit Internship Role" : "Create New Internship Role"}
              </span>
              <h2 className="headline mt-1 text-2xl text-[#F7F2F6]">
                {roleForm.id ? "Update Role Viewing Details" : "Publish Dynamic Opportunity"}
              </h2>
            </div>

            {roleError && (
              <div className="mb-4 flex items-center gap-2 rounded border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
                <AlertCircle size={16} />
                <span>{roleError}</span>
              </div>
            )}

            {roleSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded border border-[#33FF67]/40 bg-[#33FF67]/10 p-3 text-xs text-[#33FF67]">
                <CheckCircle2 size={16} />
                <span>{roleSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  value={roleForm.role}
                  onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
                  placeholder="e.g. AI / Machine Learning Engineer Intern"
                  className="field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                    Domain Category *
                  </label>
                  <select
                    value={roleForm.domain}
                    onChange={(e) => setRoleForm({ ...roleForm, domain: e.target.value })}
                    className="field"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                    Mode of Work
                  </label>
                  <select
                    value={roleForm.mode}
                    onChange={(e) => setRoleForm({ ...roleForm, mode: e.target.value })}
                    className="field font-mono"
                  >
                    <option value="onsite">On-Campus / Onsite</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={roleForm.location}
                    onChange={(e) => setRoleForm({ ...roleForm, location: e.target.value })}
                    placeholder="MLRIT Campus / Hyderabad"
                    className="field"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={roleForm.duration}
                    onChange={(e) => setRoleForm({ ...roleForm, duration: e.target.value })}
                    placeholder="3 - 6 Months"
                    className="field"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                    Status
                  </label>
                  <select
                    value={roleForm.status}
                    onChange={(e) => setRoleForm({ ...roleForm, status: e.target.value })}
                    className="field font-mono"
                  >
                    <option value="open">Open (Accepting Applications)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Stipend / Salary Structure
                </label>
                <input
                  type="text"
                  value={roleForm.salary}
                  onChange={(e) => setRoleForm({ ...roleForm, salary: e.target.value })}
                  placeholder="Commensurate with performance or ₹20,000 / month"
                  className="field"
                />
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Role Description & Overview
                </label>
                <textarea
                  rows={3}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Comprehensive description of the internship and day-to-day workflow..."
                  className="field"
                />
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Key Responsibilities (One per line)
                </label>
                <textarea
                  rows={3}
                  value={roleForm.responsibilities}
                  onChange={(e) => setRoleForm({ ...roleForm, responsibilities: e.target.value })}
                  placeholder="• Develop REST APIs with Node.js&#10;• Build responsive UI in React"
                  className="field font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={roleForm.skills}
                  onChange={(e) => setRoleForm({ ...roleForm, skills: e.target.value })}
                  placeholder="React, TypeScript, Python, Docker, Tailwind"
                  className="field font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Eligibility Criteria
                </label>
                <input
                  type="text"
                  value={roleForm.eligibility}
                  onChange={(e) => setRoleForm({ ...roleForm, eligibility: e.target.value })}
                  placeholder="Open to all registered Equinox attendees"
                  className="field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="btn btn-line px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="btn btn-signal px-6 text-xs font-bold disabled:opacity-50"
                >
                  {isSavingRole ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Saving Role...
                    </span>
                  ) : roleForm.id ? (
                    "Save Changes"
                  ) : (
                    "Publish Role"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Add CNF Student Access Modal --- */}
      {cnfModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-white/20 bg-[#161616] p-6 text-[#F7F2F6] shadow-2xl md:p-8">
            <button
              onClick={() => setCnfModalOpen(false)}
              className="absolute right-4 top-4 text-[#F7F2F6]/60 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mb-5 border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold text-[#33FF67] uppercase tracking-wider">
                Student Access Control
              </span>
              <h2 className="headline mt-1 text-2xl text-[#F7F2F6]">
                Add New CNF Login Access
              </h2>
            </div>

            <div className="mb-4 rounded-xl border border-[#33FF67]/30 bg-[#33FF67]/5 p-3.5 text-xs text-white/80 leading-relaxed font-sans">
              <div className="flex items-center gap-2 font-mono font-bold text-[#33FF67]">
                <Sparkles size={14} /> Immediate Access Enabled
              </div>
              <p className="mt-1">
                The student will immediately be able to log in at <code>/login</code> using this Confirmation Number. Their password will be automatically configured as their exact CNF number.
              </p>
            </div>

            {cnfError && (
              <div className="mb-4 flex items-center gap-2 rounded border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
                <AlertCircle size={16} />
                <span>{cnfError}</span>
              </div>
            )}

            {cnfSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded border border-[#33FF67]/40 bg-[#33FF67]/10 p-3 text-xs text-[#33FF67]">
                <CheckCircle2 size={16} />
                <span>{cnfSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveCnf} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-xs font-bold text-white/80">
                    Confirmation Number (CNF) *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateCnf}
                    className="font-mono text-[11px] text-[#7484FE] hover:underline"
                  >
                    Generate Random CNF
                  </button>
                </div>
                <input
                  type="text"
                  value={cnfForm.cnfNumber}
                  onChange={(e) => setCnfForm({ ...cnfForm, cnfNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. CNF-A1B2C3"
                  className="field uppercase font-mono tracking-wider font-semibold"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  value={cnfForm.fullName}
                  onChange={(e) => setCnfForm({ ...cnfForm, fullName: e.target.value })}
                  placeholder="e.g. Varshini Kayidapuram"
                  className="field"
                  required
                />
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Institution / College Name
                </label>
                <input
                  type="text"
                  value={cnfForm.college}
                  onChange={(e) => setCnfForm({ ...cnfForm, college: e.target.value })}
                  placeholder="MLR Institute of Technology"
                  className="field"
                />
              </div>

              <div>
                <label className="font-mono text-xs font-bold text-white/80 block mb-1">
                  Contact Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={cnfForm.mobile}
                  onChange={(e) => setCnfForm({ ...cnfForm, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCnfModalOpen(false)}
                  className="btn btn-line px-4 text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSavingCnf}
                  className="btn btn-signal px-6 text-xs font-bold disabled:opacity-50"
                >
                  {isSavingCnf ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Authorizing Student...
                    </span>
                  ) : (
                    "Authorize & Grant Login"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
