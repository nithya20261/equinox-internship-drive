import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Lock, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Container, Eyebrow, TbaBadge } from "@/components/site/primitives";
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
                <dt className="eyebrow text-muted-foreground">Location</dt>
                <dd className="font-mono text-xs text-foreground">{location}</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-4">
                <dt className="eyebrow text-muted-foreground">Mode</dt>
                <dd className="font-mono text-xs text-[#33FF67]">{mode}</dd>
              </div>
            </dl>

            <div className="border-t border-foreground p-5 space-y-4">
              <div className="border-b border-white/10 pb-2">
                <span className="font-mono text-[11px] font-bold text-[#7484FE] uppercase tracking-wider">
                  Equinox Career Connect
                </span>
                <h3 className="font-display text-lg text-[#F7F2F6]">Apply for this Role</h3>
              </div>

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
                <StudentApplicationForm initialRoleId={id} />
              )}
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
