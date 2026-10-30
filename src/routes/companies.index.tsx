import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { Container, PageHero } from "@/components/site/primitives";
import { OpportunityCard } from "@/components/site/blocks";
import { INTERNSHIP_COMPANIES } from "@/data/companies";
import type { Opportunity } from "@/lib/api";

export const Route = createFileRoute("/companies/")({
  head: () =>
    pageMeta(
      "Companies & Startups",
      "Directory of startups and companies participating in the Equinox E-Summit 2K26 Internship Drive."
    ),
  component: Companies,
});

function Companies() {
  return (
    <>
      <PageHero
        label="Company directory"
        title={
          <>
            Startups &<br />companies.
          </>
        }
      >
        Organisations offering internships at Equinox 2K26. Browse by industry, company type and open roles.
      </PageHero>
      <Container className="py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INTERNSHIP_COMPANIES.map((item, idx) => (
            <OpportunityCard
              key={item.id}
              n={idx + 1}
              item={{
                id: item.id,
                role: item.role || item.company,
                company: item.company,
                mode: item.mode,
                duration: item.duration,
                description: item.description,
                requirement: item.requirement,
                stipend: item.stipend,
                status: "open",
                created_at: new Date().toISOString(),
              } as Opportunity}
            />
          ))}
        </div>
      </Container>
    </>
  );
}
