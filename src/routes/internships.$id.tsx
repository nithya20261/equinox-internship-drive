import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { Container, Eyebrow, TbaBadge } from "@/components/site/primitives";
import { useAuth } from "@/lib/auth";

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

const SECTIONS = ["About the company", "About the internship", "Responsibilities", "Skills", "Eligibility", "Application information"];
const FACTS = ["Company", "Duration", "Location", "Mode", "Domain"];

function Detail() {
  const { isLoggedIn } = useAuth();

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

  // When logged in, show complete details
  return (
    <Container className="py-12 md:py-16">
      <Link to="/internships" className="eyebrow inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> All opportunities
      </Link>
      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Eyebrow index="●">Company · To Be Announced</Eyebrow>
          <h1 className="display mt-6 text-6xl md:text-8xl">Internship role</h1>
          <div className="mt-4"><TbaBadge>Listing not yet published</TbaBadge></div>
          <div className="mt-14 space-y-0 border-t border-foreground">
            {SECTIONS.map((s, i) => (
              <section key={s} className="grid gap-3 border-b border-border py-8 md:grid-cols-3">
                <h2 className="eyebrow"><span className="text-signal">{String(i + 1).padStart(2, "0")}</span> {s}</h2>
                <p className="text-muted-foreground md:col-span-2">To Be Announced</p>
              </section>
            ))}
          </div>
        </div>
        <aside className="lg:col-span-4">
          <div className="sticky top-24 border border-foreground bg-card">
            <dl className="divide-y divide-border">
              {FACTS.map((f) => (
                <div key={f} className="flex justify-between gap-4 px-5 py-4">
                  <dt className="eyebrow text-muted-foreground">{f}</dt>
                  <dd className="text-sm">TBA</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-foreground p-5">
              <button className="btn btn-signal w-full" disabled aria-describedby="apply-note">Apply</button>
              <p id="apply-note" className="mt-3 text-center text-xs text-muted-foreground">Applications open when listings are published.</p>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
