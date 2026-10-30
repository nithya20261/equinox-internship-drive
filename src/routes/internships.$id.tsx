import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Container } from "@/components/site/primitives";
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

  if (isLoading) {
    return (
      <Container className="py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-signal" />
        <p className="eyebrow mt-4 text-muted-foreground">Loading opportunity details...</p>
      </Container>
    );
  }

  const roleTitle = opportunity?.role || "Cloud & DevOps Engineering Intern";
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
    <div className="w-full min-h-screen px-4 sm:px-8 lg:px-12 py-8 md:py-12">
      <Link
        to="/internships"
        className="eyebrow inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> All opportunities
      </Link>

      {/* TOP: Role Description & Specifications (Full Width) */}
      <div className="mt-6 w-full border border-white/20 bg-[#151515] p-6 md:p-10 rounded-2xl shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7484FE]">
            <ShieldCheck className="h-4 w-4 text-[#33FF67]" />
            <span>Hiring Partner Protected · Confidential</span>
          </div>
          <span className="inline-flex items-center gap-1.5 border border-[#33FF67] bg-[#33FF67]/10 px-3.5 py-1 font-mono text-xs text-[#33FF67] rounded-full">
            ● Open for Applications
          </span>
        </div>

        <h1 className="font-display mt-4 text-3xl md:text-5xl lg:text-6xl text-[#F7F2F6]">
          {roleTitle}
        </h1>

        {/* Essential Role Specs Badges */}
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-[#F7F2F6] rounded-lg">
            Domain: {domain}
          </span>
          <span className="border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-[#33FF67] rounded-lg">
            Mode: {mode}
          </span>
          <span className="border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-[#7484FE] rounded-lg">
            Location: {location}
          </span>
          <span className="border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-[#F7F2F6]/70 rounded-lg">
            Duration: {duration}
          </span>
        </div>

        {/* Role Description */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <h2 className="text-xs font-mono uppercase text-[#7484FE] tracking-wider font-bold">
            Role Overview & Description
          </h2>
          <p className="mt-3 text-sm md:text-base leading-relaxed text-[#F7F2F6]/85 font-sans">
            {opportunity?.description ||
              "Scale resilient cloud infrastructures for high-throughput microservices. Work on production-grade problem statements with direct industry mentorship during the Equinox E-Summit 2K26 Internship Drive."}
          </p>
        </div>

        {/* Responsibilities & Skills */}
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
            {opportunity?.eligibility && (
              <div className="mt-5">
                <h4 className="text-[11px] font-mono uppercase text-[#33FF67] font-bold">
                  Eligibility Criteria
                </h4>
                <p className="mt-1 text-xs text-[#F7F2F6]/70">
                  {opportunity.eligibility}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BELOW: 10 Blocks of Details & Resume Uploading (Full Width) */}
      <div className="mt-10 w-full border border-white/20 bg-[#151515] p-6 md:p-10 rounded-2xl shadow-2xl">
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7484FE]">
            <span>EQUINOX CAREER CONNECT</span>
            <span>·</span>
            <span className="text-[#33FF67]">10 DETAILS BLOCKS</span>
          </div>
          <h2 className="font-display mt-2 text-2xl md:text-4xl text-[#F7F2F6]">
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
