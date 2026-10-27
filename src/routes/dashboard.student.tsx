import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/lib/auth";
import {
  getStudentProfile,
  getStudentApplications,
  getResumeDownloadUrl,
  type StudentApplication,
} from "@/lib/api";
import {
  User,
  FileText,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Lock,
  Loader2,
  Building2,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/student")({
  head: () => ({
    meta: [
      { title: "Student dashboard — Internship Drive" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { user, isLoggedIn, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [downloadingResume, setDownloadingResume] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (isLoggedIn) {
      Promise.all([getStudentProfile(), getStudentApplications()])
        .then(([prof, apps]) => {
          if (mounted) {
            setProfile(prof);
            setApplications(apps);
            setIsLoadingData(false);
          }
        })
        .catch(() => {
          if (mounted) setIsLoadingData(false);
        });
    } else if (!loading) {
      setIsLoadingData(false);
    }
    return () => {
      mounted = false;
    };
  }, [isLoggedIn, loading]);

  const handleDownloadResume = async () => {
    const resumePath = profile?.student?.resume_url;
    if (!resumePath) return;

    try {
      setDownloadingResume(true);
      const url = await getResumeDownloadUrl(resumePath);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        alert("Resume file not accessible or currently processing.");
      }
    } catch (err) {
      console.error("Resume download error:", err);
    } finally {
      setDownloadingResume(false);
    }
  };

  if (!loading && !isLoggedIn) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[#2A2A2A] bg-black text-[#7484FE]">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="headline mt-6 text-3xl md:text-4xl">Login Required</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Please log in to your student account to view your applications and registration profile.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="btn btn-signal">
            Log in
          </Link>
          <Link to="/register" className="btn btn-line">
            Register
          </Link>
        </div>
      </div>
    );
  }

  const student = profile?.student;
  const fullName = student?.full_name || user?.name || "Student Candidate";
  const teamCode = student?.team_code || user?.teamCode || "EQX-TBD";
  const email = student?.email || profile?.user?.email || user?.email || "—";
  const college = student?.college || "—";
  const mobile = student?.mobile || "—";
  const resumeUrl = student?.resume_url;

  // Render profile section
  const profileContent = (
    <div className="space-y-6">
      <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border border-[#7484FE] bg-black text-[#7484FE]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="headline text-2xl text-[#F7F2F6]">{fullName}</h3>
              <p className="font-mono text-xs text-[#33FF67]">Candidate Verified</p>
            </div>
          </div>
          <div className="border border-[#7484FE] bg-[#7484FE]/10 px-3 py-1 font-mono text-xs text-[#7484FE]">
            Team Code: <span className="font-bold text-[#F7F2F6]">{teamCode}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="border border-[#2A2A2A] bg-black p-4">
            <p className="eyebrow text-xs text-muted-foreground">College / University</p>
            <p className="mt-1 font-mono text-sm text-[#F7F2F6]">{college}</p>
          </div>
          <div className="border border-[#2A2A2A] bg-black p-4">
            <p className="eyebrow text-xs text-muted-foreground">Mobile Contact</p>
            <p className="mt-1 font-mono text-sm text-[#F7F2F6]">{mobile}</p>
          </div>
          <div className="border border-[#2A2A2A] bg-black p-4">
            <p className="eyebrow text-xs text-muted-foreground">Registered Email</p>
            <p className="mt-1 font-mono text-sm text-[#F7F2F6]">{email}</p>
          </div>
          <div className="border border-[#2A2A2A] bg-black p-4">
            <p className="eyebrow text-xs text-muted-foreground">Uploaded Resume</p>
            {resumeUrl ? (
              <div className="mt-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-xs text-[#33FF67]">
                  <FileText className="h-4 w-4" /> Attached (Private)
                </span>
                <button
                  type="button"
                  onClick={handleDownloadResume}
                  disabled={downloadingResume}
                  className="btn btn-line h-7 px-2.5 text-xs"
                >
                  {downloadingResume ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-1 h-3.5 w-3.5" /> View
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Recorded via registration form
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render applications section
  const applicationsContent =
    applications.length > 0 ? (
      <div className="space-y-4">
        {applications.map((app) => (
          <div
            key={app.id}
            className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 transition-colors hover:border-[#7484FE]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#7484FE]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#33FF67]" />
                  <span>Partner Organization (Confidential)</span>
                </div>
                <h3 className="headline mt-1.5 text-xl text-[#F7F2F6]">
                  {app.internship?.role || "Internship Role"}
                </h3>
                <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
                  <span>Domain: {app.internship?.domain || "Engineering"}</span>
                  <span>•</span>
                  <span>Location: {app.internship?.location || "MLRIT"}</span>
                  <span>•</span>
                  <span className="text-[#33FF67]">
                    Mode: {app.internship?.mode || "On-Campus"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex items-center gap-1.5 border border-[#33FF67] bg-[#33FF67]/10 px-3 py-1 font-mono text-xs text-[#33FF67] uppercase">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {app.status || "Submitted"}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-8 text-center">
        <p className="headline text-xl text-[#F7F2F6]">No applications submitted yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse active internship listings and submit your application with your verified profile.
        </p>
        <Link to="/internships" className="btn btn-signal mt-6">
          Browse Opportunities <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    );

  const notificationsContent = (
    <div className="space-y-3">
      <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-4 text-xs font-mono">
        <div className="flex items-center justify-between text-[#7484FE]">
          <span>Equinox E-Summit 2K26 Drive</span>
          <span>Broadcast</span>
        </div>
        <p className="mt-2 text-[#F7F2F6] leading-relaxed">
          Welcome to the Equinox Career Connect portal. Your candidate registration has been
          linked to team code <span className="text-[#33FF67]">{teamCode}</span>. Company partner
          identities will be unmasked to shortlisted candidates during interview scheduling.
        </p>
      </div>
    </div>
  );

  return (
    <DashboardShell
      role="Student"
      subtitle={teamCode}
      sections={[
        {
          key: "profile",
          label: "Profile",
          empty: "Complete your profile with education, skills and resume.",
          content: profileContent,
        },
        {
          key: "applications",
          label: "Applications",
          empty: "Roles you apply to and their status will appear here.",
          content: applicationsContent,
        },
        {
          key: "saved",
          label: "Saved opportunities",
          empty: "Bookmark roles to compare them later.",
        },
        {
          key: "notifications",
          label: "Notifications",
          empty: "Updates from organisers and companies will show here.",
          content: notificationsContent,
        },
      ]}
    />
  );
}
