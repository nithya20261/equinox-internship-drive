import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Lock, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Container, Eyebrow, TbaBadge } from "@/components/site/primitives";
import { useAuth } from "@/lib/auth";
import { getOpportunityById, submitApplication, type Opportunity } from "@/lib/api";

export const Route = createFileRoute("/internships/$id")({
  head: () => ({
    meta: [
      { title: "Internship details — Internship Drive · Equinox 2K26" },
      { name: "description", content: "Internship role details for the Equinox E-Summit 2K26 Internship Drive." },
      { property: "og:title", content: "Internship details — Equinox 2K26" },
      { property: "og:description", content: "Internship role details for the Equinox E-Summit 2K26 Internship Drive." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { isLoggedIn, isStudent } = useAuth();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(id !== "preview");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [resumeMode, setResumeMode] = useState<"profile" | "custom">("profile");
  const [customResume, setCustomResume] = useState<File | null>(null);

  useEffect(() => {
    if (id && id !== "preview") {
      getOpportunityById(id)
        .then((res) => {
          setOpportunity(res);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  // If user is not logged in, prevent viewing details
  if (!isLoggedIn) {
    return (
      <Container className="py-20">
        <Link to="/internships" className="eyebrow inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> All opportunities
        </Link>
        <div className="mx-auto mt-10 max-w-xl border border-foreground bg-card p-10 text-center md:p-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-foreground bg-paper-deep text-signal">
            <Lock className="h-8 w-8" />
          </div>
          <p className="eyebrow mt-6 text-signal">Access Restricted</p>
          <h1 className="headline mt-3 text-4xl md:text-5xl">Log In to View Details</h1>
          <p className="mt-4 text-muted-foreground">
            Internship role descriptions, company profiles, responsibilities, eligibility requirements and application forms are visible exclusively to registered students and attendees.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/login" className="btn btn-signal">
              Log in to access
            </Link>
            <Link to="/register" className="btn btn-line">
              Create student account
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  const handleApply = async () => {
    if (!id || id === "preview") return;
    setApplyError(null);
    setApplySuccess(null);

    if (resumeMode === "custom" && !customResume) {
      setApplyError("Please select a resume file to upload (PDF, DOC, or DOCX).");
      return;
    }

    try {
      setIsApplying(true);
      const res = await submitApplication(id, {
        customResume: resumeMode === "custom" && customResume ? customResume : undefined,
      });
      if (res.alreadyApplied) {
        setApplySuccess("You have already applied for this role! Check your Student Dashboard to track status.");
      } else {
        setApplySuccess("Application successfully submitted! Your profile and resume have been forwarded.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit application. Please try again.";
      setApplyError(msg);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-signal" />
        <p className="eyebrow mt-4 text-muted-foreground">Loading opportunity details...</p>
      </Container>
    );
  }

  const roleTitle = opportunity?.role || "Internship role";
  const domain = opportunity?.domain || "Technology / Engineering";
  const duration = opportunity?.duration || "2 - 6 Months";
  const location = opportunity?.location || "MLRIT Campus";
  const mode = opportunity?.mode || "On-Campus";

  const sections = [
    {
      title: "About the company",
      content:
        "Company identity is shielded under the Equinox Recruiter Shield to prevent hiring bias. Verified candidates who pass shortlisting will receive full corporate partner specifications.",
    },
    {
      title: "About the internship",
      content:
        opportunity?.description ||
        "Drive hands-on innovation during the Equinox E-Summit 2K26 Internship Drive. Work on production-grade problem statements with direct industry mentorship.",
    },
    {
      title: "Responsibilities",
      content:
        Array.isArray(opportunity?.responsibilities)
          ? opportunity.responsibilities.join(" • ")
          : opportunity?.responsibilities || "Execute technical sprint milestones, coordinate with team leads, and document project deliverables.",
    },
    {
      title: "Skills & Requirements",
      content:
        Array.isArray(opportunity?.skills)
          ? opportunity.skills.join(", ")
          : opportunity?.skills || "Relevant core engineering skills, problem-solving abilities, and collaboration mindset.",
    },
    {
      title: "Eligibility",
      content:
        opportunity?.eligibility ||
        "Open to all registered undergraduate and postgraduate engineering students attending Equinox 2K26.",
    },
    {
      title: "Application information",
      content:
        "Applications are reviewed on a rolling basis. Shortlisted teams will be invited for on-campus interviews during the E-Summit.",
    },
  ];

  return (
    <Container className="py-12 md:py-16">
      <Link to="/internships" className="eyebrow inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> All opportunities
      </Link>

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7484FE]">
            <ShieldCheck className="h-4 w-4 text-[#33FF67]" />
            <span>Hiring Partner Protected · Confidential</span>
          </div>

          <h1 className="display mt-6 text-5xl md:text-7xl">{roleTitle}</h1>

          <div className="mt-4">
            {opportunity ? (
              <span className="inline-flex items-center gap-1.5 border border-[#33FF67] bg-[#33FF67]/10 px-3 py-1 font-mono text-xs text-[#33FF67]">
                ● Open for Applications
              </span>
            ) : (
              <TbaBadge>Listing not yet published</TbaBadge>
            )}
          </div>

          <div className="mt-14 space-y-0 border-t border-foreground">
            {sections.map((s, i) => (
              <section key={s.title} className="grid gap-3 border-b border-border py-8 md:grid-cols-3">
                <h2 className="eyebrow">
                  <span className="text-signal">{String(i + 1).padStart(2, "0")}</span> {s.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed md:col-span-2">
                  {s.content}
                </p>
              </section>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 border border-foreground bg-card">
            <dl className="divide-y divide-border">
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="eyebrow text-muted-foreground">Company</dt>
                <dd className="font-mono text-xs text-[#7484FE]">Shielded Partner</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="eyebrow text-muted-foreground">Domain</dt>
                <dd className="font-mono text-xs text-foreground">{domain}</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="eyebrow text-muted-foreground">Duration</dt>
                <dd className="font-mono text-xs text-foreground">{duration}</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="eyebrow text-muted-foreground">Location</dt>
                <dd className="font-mono text-xs text-foreground">{location}</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="eyebrow text-muted-foreground">Mode</dt>
                <dd className="font-mono text-xs text-[#33FF67]">{mode}</dd>
              </div>
            </dl>

            <div className="border-t border-foreground p-5 space-y-3">
              {applySuccess ? (
                <div className="border border-[#33FF67] bg-[#33FF67]/10 p-4 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#33FF67]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Application Submitted</span>
                  </div>
                  <p className="mt-1 text-foreground/80">{applySuccess}</p>
                  <Link
                    to="/dashboard/student"
                    className="btn btn-signal mt-3 w-full text-xs"
                  >
                    View in Dashboard
                  </Link>
                </div>
              ) : (
                <>
                  {applyError && (
                    <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
                      {applyError}
                    </div>
                  )}

                  {id === "preview" ? (
                    <>
                      <button className="btn btn-signal w-full opacity-60" disabled>
                        Apply (Preview Mode)
                      </button>
                      <p className="text-center text-xs text-muted-foreground">
                        Applications open when live listings are published.
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Resume choice options */}
                      <div className="border border-[#2A2A2A] bg-black p-3 space-y-2">
                        <p className="font-mono text-[10px] uppercase font-bold text-[#7484FE]">
                          Resume Submission
                        </p>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="detailResumeChoice"
                            value="profile"
                            checked={resumeMode === "profile"}
                            onChange={() => setResumeMode("profile")}
                            className="accent-[#33FF67]"
                          />
                          <span className="text-[#F7F2F6]">Use Profile Resume</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="detailResumeChoice"
                            value="custom"
                            checked={resumeMode === "custom"}
                            onChange={() => setResumeMode("custom")}
                            className="accent-[#33FF67]"
                          />
                          <span className="text-[#F7F2F6]">Upload Different Resume</span>
                        </label>

                        {resumeMode === "custom" && (
                          <div className="pt-2 border-t border-[#2A2A2A]">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => setCustomResume(e.target.files?.[0] || null)}
                              className="w-full text-[11px] text-[#F7F2F6] file:mr-2 file:border-0 file:bg-[#7484FE] file:px-2 file:py-1 file:font-mono file:text-[10px] file:text-black"
                            />
                            {customResume && (
                              <p className="mt-1 text-[10px] font-mono text-[#33FF67]">
                                Attached: {customResume.name}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleApply}
                        disabled={isApplying || !isStudent}
                        className="btn btn-signal w-full disabled:opacity-50"
                      >
                        {isApplying ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                          </span>
                        ) : isStudent ? (
                          "Apply Now"
                        ) : (
                          "Apply (Student Account Required)"
                        )}
                      </button>
                      <p className="text-center text-xs text-muted-foreground">
                        Your application record will be created with an independent review status.
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
