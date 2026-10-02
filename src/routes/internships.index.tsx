import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { Container, EmptyState, PageHero } from "@/components/site/primitives";
import { FilterBar } from "@/components/site/Filters";
import { OpportunitySlot } from "@/components/site/blocks";

export const Route = createFileRoute("/internships/")({
  head: () => pageMeta("Opportunities", "Search internship opportunities from startups and companies at Equinox E-Summit 2K26. Listings are being finalised."),
  component: Internships,
});

function Internships() {
  return (
    <>
      <PageHero label="Opportunities board" title={<>Find your<br />internship.</>}>
        Search and filter roles by domain, type, location, skills and company once listings go live.
      </PageHero>
      <Container className="py-14">
        <FilterBar placeholder="Search roles, skills or companies" filters={["Domain", "Internship type", "Location", "Skills", "Company"]} />
        <div className="mt-6 flex items-center justify-between border-b border-foreground pb-3">
          <p className="eyebrow">0 listings</p>
          <p className="eyebrow text-muted-foreground">Sorted by · newest</p>
        </div>
        <div className="mt-10">
          <EmptyState
            title="Internship opportunities are being finalised."
            body="Participating companies and roles will appear here soon. Register to be ready when applications open."
            action={<Link to="/register" className="btn btn-ink">Register <ArrowRight size={16} /></Link>}
          />
        </div>
        <div className="mt-16">
          <p className="eyebrow mb-4 text-muted-foreground">Listing preview — structure only</p>
          <div className="border-t border-foreground opacity-70">
            {[1, 2].map((n) => <OpportunitySlot key={n} n={n} />)}
          </div>
          <Link to="/internships/$id" params={{ id: "preview" }} className="btn btn-line mt-8">
            Preview a detail page <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </>
  );
}
