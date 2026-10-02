import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { Container, EmptyState, PageHero } from "@/components/site/primitives";
import { FilterBar } from "@/components/site/Filters";

export const Route = createFileRoute("/companies/")({
  head: () => pageMeta("Companies & Startups", "Directory of startups and companies participating in the Equinox E-Summit 2K26 Internship Drive. Announcements coming soon."),
  component: Companies,
});

function Companies() {
  return (
    <>
      <PageHero label="Company directory" title={<>Startups &<br />companies.</>}>
        Organisations offering internships at Equinox 2K26. Browse by industry, company type and open roles.
      </PageHero>
      <Container className="py-14">
        <FilterBar placeholder="Search companies" filters={["Industry / domain", "Company type", "Internship availability"]} />
        <div className="mt-10">
          <EmptyState title="Companies will be announced soon." body="The directory will list every participating startup and company with their open internships." />
        </div>
      </Container>
    </>
  );
}
