import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Container, TbaBadge } from "@/components/site/primitives";
import { getOpportunityById, type Opportunity } from "@/lib/api";
import { StudentApplicationForm } from "@/components/site/StudentApplicationForm";

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



  if (isLoading) {
    return (
      <Container className="py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-signal" />
        <p className="eyebrow mt-4 text-muted-foreground">Loading opportunity details...</p>
      </Container>
    );
  }

  const roleTitle = opportunity?.role || opportunity?.company || "Internship Role";
  const domain = opportunity?.domain || "Technology / Engineering";
  const duration = opportunity?.duration || "2 - 6 Months";
  const location = opportunity?.location || "MLRIT Campus";
  const mode = opportunity?.mode || "On-Campus";

  const parsedResponsibilities: string[] = Array.isArray(opportunity?.responsibilities)
    ? opportunity.responsibilities
    : (opportunity?.responsibilities || "Build CI/CD pipelines • Monitor Kubernetes clusters • Write Terraform modules")
        .split(/[,•\n]/)
        .map((r) => r.trim())
        .filter(Boolean);

  const parsedSkills: string[] = Array.isArray(opportunity?.skills)
    ? opportunity.skills
    : (opportunity?.skills || "Docker, Kubernetes, AWS, Terraform, Go")
        .split(/[,•]/)
        .map((s) => s.trim())
        .filter(Boolean);

  return (
    <div className="w-full min-h-screen px-4 sm:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
      <Link
        to="/internships"
        className="eyebrow inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> All opportunities
      </Link>

      {/* TOP: Role Description & Specifications (Full Width) */}
      <div className="mt-6 w-full border border-white/20 bg-[#151515] p-4 sm:p-6 md:p-10 rounded-2xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7484FE]">
            {opportunity?.company && opportunity.company !== "Partner Organization (Confidential)" ? (
              <span className="text-[#33FF67] font-bold uppercase tracking-wider text-sm">
                {opportunity.company}
              </span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-[#33FF67]" />
                <span>Hiring Partner Protected · Confidential</span>
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 border border-[#33FF67] bg-[#33FF67]/10 px-3.5 py-1 font-mono text-xs text-[#33FF67] rounded-full">
            ● Open for Applications
          </span>
        </div>

        <h1 className="font-display mt-4 text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-[#F7F2F6] break-words">
          {roleTitle}
        </h1>

        {/* Role Requirement (if present) */}
        {opportunity?.requirement && (
          <div className="mt-5 rounded-xl border border-white/10 bg-[#1e1e1e] p-4 text-sm font-sans text-white/90">
            <span className="font-mono text-xs font-bold text-[#7484FE] uppercase tracking-wider block mb-1">
              Requirements
            </span>
            <p className="leading-relaxed whitespace-pre-line">{opportunity.requirement}</p>
          </div>
        )}

        {/* Essential Role Specs Badges (Mode, Duration, Stipend - ONLY if given!) */}
        {(opportunity?.mode || opportunity?.duration || opportunity?.stipend) && (
          <div className="mt-5 flex flex-wrap gap-3 font-mono text-xs">
            {opportunity.mode && (
              <span className="border border-white/10 bg-white/5 px-3.5 py-1.5 text-[#33FF67] rounded-lg font-semibold">
                <span className="text-white/40 font-normal">Mode: </span>
                {opportunity.mode}
              </span>
            )}
            {opportunity.duration && (
              <span className="border border-white/10 bg-white/5 px-3.5 py-1.5 text-[#7484FE] rounded-lg font-medium">
                <span className="text-white/40 font-normal">Duration: </span>
                {opportunity.duration}
              </span>
            )}
            {opportunity.stipend && (
              <span className="border border-white/10 bg-white/5 px-3.5 py-1.5 text-[#F7F2F6] rounded-lg font-medium">
                <span className="text-white/40 font-normal">Stipend: </span>
                <span className={opportunity.stipend.toLowerCase().startsWith("provided") ? "text-[#33FF67] font-semibold" : "text-white/60"}>
                  {opportunity.stipend}
                </span>
              </span>
            )}
          </div>
        )}

        {/* Role Description (ONLY if given!) */}
        {opportunity?.description && (
          <div className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-xs font-mono uppercase text-[#7484FE] tracking-wider font-bold">
              Job Description
            </h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-[#F7F2F6]/85 font-sans">
              {opportunity.description}
            </p>
          </div>
        )}

        {/* Responsibilities & Skills (only if defined on opportunity) */}
        {opportunity?.responsibilities && (
          <div className="mt-8 grid gap-8 md:grid-cols-2 border-t border-white/10 pt-6">
            <div>
              <h3 className="text-xs font-mono uppercase text-[#7484FE] tracking-wider font-bold">
                Key Responsibilities
              </h3>
              <ul className="mt-3 space-y-2.5 text-xs md:text-sm text-[#F7F2F6]/80 font-sans">
                {parsedResponsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-[#33FF67] font-bold mt-0.5">▹</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {parsedSkills.length > 0 && (
              <div>
                <h3 className="text-xs font-mono uppercase text-[#7484FE] tracking-wider font-bold">
                  Skills & Requirements
                </h3>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {parsedSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-[#7484FE]/30 bg-[#7484FE]/10 px-3 py-1 font-mono text-xs text-[#7484FE]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BELOW: 10 Blocks of Details & Resume Uploading (Full Width) */}
      <div className="mt-8 sm:mt-10 w-full border border-white/20 bg-[#151515] p-4 sm:p-6 md:p-10 rounded-2xl shadow-2xl">
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7484FE]">
            <span>EQUINOX CAREER CONNECT</span>
            <span>·</span>
            <span className="text-[#33FF67]">10 DETAILS BLOCKS</span>
          </div>
          <h2 className="font-display mt-2 text-xl sm:text-3xl md:text-4xl text-[#F7F2F6] break-words">
            Upload Resume & Candidate Details
          </h2>
          <p className="mt-1 text-xs md:text-sm text-[#F7F2F6]/60">
            Fill in the 10 blocks of candidate details below, upload your resume (PDF/DOC), and provide your one-minute self-introduction video link.
          </p>
        </div>

        <div className="mt-8 w-full">
          <StudentApplicationForm initialRoleId={id === "preview" ? undefined : id} />
        </div>
      </div>
    </div>
  );
}
