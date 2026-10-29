import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Container } from "@/components/site/primitives";
import { useAuth } from "@/lib/auth";
import {
  getStudentApplications,
  getResumeDownloadUrl,
  type StudentApplication,
} from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  Loader2,
  Download,
  FileText,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/student")({
  head: () => ({
    meta: [
      { title: "Student Applications — Internship Drive" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { user, isLoggedIn, loading } = useAuth();
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (isLoggedIn) {
      getStudentApplications()
        .then((apps) => {
          if (mounted) {
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

  const handleDownloadResume = async (appId: string, resumePath?: string | null) => {
    if (!resumePath) return;

    try {
      setDownloadingId(appId);
      const url = await getResumeDownloadUrl(resumePath);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        alert("Resume file not accessible.");
      }
    } catch (err) {
      console.error("Resume download error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (!loading && !isLoggedIn) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-xl border border-[#2A2A2A] bg-[#0A0A0A] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[#7484FE] bg-black text-[#7484FE]">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="headline mt-6 text-3xl md:text-4xl">Login Required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Please log in to your student account to view your applications.
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
      </Container>
    );
  }

  const teamCode = user?.teamCode || "EQX-STUDENT";

  return (
    <Container className="py-12 md:py-16">
      {/* Header Bar */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground pb-6">
        <div>
          <p className="eyebrow text-[#33FF67]">
            Student Account · <span className="text-[#F7F2F6]">{teamCode}</span>
          </p>
          <h1 className="display mt-2 text-4xl md:text-6xl">My Applications</h1>
        </div>
        <Link to="/internships" className="btn btn-signal h-11 px-5 text-xs font-mono">
          Explore More Roles <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Main Applications Content */}
      <div className="mt-8">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-20 text-[#7484FE]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3 font-mono text-sm">Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#2A2A2A] bg-black text-muted-foreground">
              <Briefcase className="h-6 w-6" />
            </div>
            <h2 className="headline mt-4 text-2xl text-[#F7F2F6]">No Roles Applied Yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Select roles from the opportunities board and upload your resume to apply.
            </p>
            <Link to="/internships" className="btn btn-signal mt-6">
              Browse Opportunities <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border border-[#2A2A2A] bg-[#0A0A0A] p-6 transition-colors hover:border-[#33FF67]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="headline text-2xl text-[#F7F2F6]">
                      {app.internship?.role || "Internship Role"}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
                      <span>Domain: <strong className="text-[#F7F2F6]">{app.internship?.domain || "Engineering"}</strong></span>
                      <span>•</span>
                      <span>Location: <strong className="text-[#F7F2F6]">{app.internship?.location || "Campus"}</strong></span>
                      <span>•</span>
                      <span className="text-[#33FF67]">Mode: {app.internship?.mode || "Onsite"}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3">
                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-1.5 border border-[#33FF67] bg-[#33FF67]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase text-[#33FF67]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>UPLOADED</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Intro Video Button */}
                      {app.video_url && (
                        <a
                          href={app.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-line h-8 px-3 text-xs font-mono"
                        >
                          <span>Video Link</span>
                          <ArrowRight className="ml-1 h-3.5 w-3.5 opacity-60" />
                        </a>
                      )}

                      {/* View Resume Button */}
                      {app.resume_url && (
                        <button
                          type="button"
                          onClick={() => handleDownloadResume(app.id, app.resume_url)}
                          disabled={downloadingId === app.id}
                          className="btn btn-line h-8 px-3 text-xs font-mono"
                        >
                          {downloadingId === app.id ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              <span>Opening...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="mr-1.5 h-3.5 w-3.5 text-[#33FF67]" />
                              <span>View Resume</span>
                              <Download className="ml-1.5 h-3.5 w-3.5 opacity-60" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
