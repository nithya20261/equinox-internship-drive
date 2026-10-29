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

  const roleTitle = opportunity?.role || "Internship role";
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
    <Container className="py-12 md:py-16 max-w-4xl">
      <Link
        to="/internships"
        className="eyebrow inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> All opportunities
      </Link>

      {/* TOP: Role Description & Specifications */}
      <div className="mt-8 border border-white/20 bg-[#151515] p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7484FE]">
            <ShieldCheck className="h-4 w-4 text-[#33FF67]" />
            <span>Hiring Partner Protected · Confidential</span>
          </div>
          {opportunity ? (
            <span className="inline-flex items-center gap-1.5 border border-[#33FF67] bg-[#33FF67]/10 px-3 py-1 font-mono text-xs text-[#33FF67] rounded-full">
              ● Open for Applications
            </span>
          ) : (
            <TbaBadge>Listing not yet published</TbaBadge>
          )}
        </div>

        <h1 className="font-display mt-4 text-3xl md:text-5xl text-[#F7F2F6]">
          {roleTitle}
        </h1>

        {/* Essential Role Specs Badges */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <span className="border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-[#F7F2F6] rounded-md">
            Domain: {domain}
          </span>
          <span className="border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-[#33FF67] rounded-md">
            Mode: {mode}
          </span>
          <span className="border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-[#7484FE] rounded-md">
            Location: {location}
          </span>
          <span className="border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-[#F7F2F6]/70 rounded-md">
            Duration: {duration}
          </span>
        </div>

        {/* Role Description */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <h2 className="text-xs font-mono uppercase text-[#7484FE] tracking-wider">
            Role Overview & Description
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#F7F2F6]/85 font-sans">
            {opportunity?.description ||
              "Scale resilient cloud infrastructures for high-throughput microservices. Work on production-grade problem statements with direct industry mentorship."}
          </p>
        </div>

        {/* Responsibilities & Skills */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 border-t border-white/10 pt-5">
          <div>
            <h3 className="text-xs font-mono uppercase text-[#7484FE] tracking-wider">
              Responsibilities
            </h3>
            <ul className="mt-2.5 space-y-2 text-xs text-[#F7F2F6]/80 font-sans">
              {parsedResponsibilities.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#33FF67] font-bold">▹</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-mono uppercase text-[#7484FE] tracking-wider">
              Skills & Requirements
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {parsedSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="rounded border border-[#7484FE]/30 bg-[#7484FE]/10 px-2.5 py-1 font-mono text-xs text-[#7484FE]"
                >
                  {sk}
                </span>
              ))}
            </div>
            {opportunity?.eligibility && (
              <div className="mt-4">
                <h4 className="text-[11px] font-mono uppercase text-[#33FF67]">
                  Eligibility
                </h4>
                <p className="mt-1 text-xs text-[#F7F2F6]/70">
                  {opportunity.eligibility}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BELOW: Resume Uploading & Application Form */}
      <div className="mt-8 border border-white/20 bg-[#151515] p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7484FE]">
            <span>EQUINOX CAREER CONNECT</span>
            <span>·</span>
            <span className="text-[#33FF67]">SUBMIT APPLICATION</span>
          </div>
          <h2 className="font-display mt-2 text-2xl md:text-3xl text-[#F7F2F6]">
            Upload Resume & Candidate Details
          </h2>
          <p className="mt-1 text-xs text-[#F7F2F6]/60">
            Fill in your candidate details, upload your resume (PDF/DOC), and provide your one-minute self-introduction video link.
          </p>
        </div>

        <div className="mt-6">
          {id === "preview" ? (
            <div className="text-center py-6">
              <button className="btn btn-signal opacity-60" disabled>
                Apply (Preview Mode)
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Applications open when live listings are published.
              </p>
            </div>
          ) : (
            <StudentApplicationForm initialRoleId={id} />
          )}
        </div>
      </div>
    </Container>
  );
}
