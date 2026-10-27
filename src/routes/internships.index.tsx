import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { Container, EmptyState, PageHero } from "@/components/site/primitives";
import { FilterBar } from "@/components/site/Filters";
import { OpportunitySlot } from "@/components/site/blocks";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/internships/")({
  head: () =>
    pageMeta(
      "Opportunities",
      "Search internship opportunities from startups and companies at Equinox E-Summit 2K26. Listings are being finalised."
    ),
  component: Internships,
});

function Internships() {
  const { isLoggedIn } = useAuth();

  return (
    <>
      <PageHero label="Opportunities board" title={<>Find your<br />internship.</>}>
        Search and filter roles by domain, type, location, skills and company once listings go live.
      </PageHero>

      <Container className="py-14">
        {/* Auth notice banner when not logged in */}
        {!isLoggedIn && (
          <div className="mb-10 flex flex-col items-start justify-between gap-4 border border-signal bg-paper-deep p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-foreground bg-ink text-signal">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="headline text-xl md:text-2xl">
                  Login Required to View Opportunity Details
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Role descriptions, company specifications, eligibility, and application forms are locked for guest users.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link to="/login" className="btn btn-line h-10 px-4">
                Log in
              </Link>
              <Link to="/register" className="btn btn-signal h-10 px-4">
                Register
              </Link>
            </div>
          </div>
        )}

        {/* Confidentiality notice */}
        <div className="mb-6 flex items-center justify-between border border-[#2A2A2A] bg-[#0A0A0A] p-4 text-xs font-mono text-[#F7F2F6]/75">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#33FF67]" />
            <span className="text-[#33FF67] font-bold uppercase">RECRUITER SHIELD ACTIVE:</span>
            <span>Hiring partner identities are concealed during candidate browsing to prevent bias.</span>
          </div>
          <span className="hidden sm:inline-block text-[#7484FE]">Admin Auth Required for Unmasking</span>
        </div>

        <FilterBar
          placeholder="Search roles, skills or domains"
          filters={["Domain", "Internship type", "Location", "Skills"]}
        />

        <div className="mt-6 flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <p className="eyebrow text-[#F7F2F6]">0 listings</p>
          <p className="eyebrow text-[#7484FE]">Sorted by · newest</p>
        </div>

        <div className="mt-10">
          <EmptyState
            title="Internship opportunities are being finalised."
            body="Participating companies and roles will appear here soon. Register or log in to be ready when applications open."
            action={
              !isLoggedIn ? (
                <Link to="/register" className="btn btn-ink">
                  Register <ArrowRight size={16} />
                </Link>
              ) : undefined
            }
          />
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between">
            <p className="eyebrow mb-4 text-muted-foreground">Listing preview — structure only</p>
            {!isLoggedIn && (
              <span className="eyebrow mb-4 flex items-center gap-1.5 text-xs text-signal">
                <Lock size={12} /> Details locked
              </span>
            )}
          </div>

          <div className="border-t border-foreground opacity-70">
            {[1, 2].map((n) => (
              <OpportunitySlot key={n} n={n} />
            ))}
          </div>

          {isLoggedIn ? (
            <Link to="/internships/$id" params={{ id: "preview" }} className="btn btn-line mt-8">
              Preview a detail page <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/login" className="btn btn-signal mt-8">
              <Lock size={16} /> Log in to view opportunity details <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </Container>
    </>
  );
}
