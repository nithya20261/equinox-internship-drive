import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { Container, PageHero } from "@/components/site/primitives";
import { FaqList } from "@/components/site/blocks";

export const Route = createFileRoute("/faq")({
  head: () => pageMeta("FAQ", "Frequently asked questions about the Equinox E-Summit 2K26 Internship Drive at MLRIT Hyderabad."),
  component: Faq,
});

function Faq() {
  return (
    <>
      <PageHero label="FAQ" title="Questions.">
        Answers based on confirmed information. Anything not yet final is marked as such.
      </PageHero>
      <Container className="max-w-4xl py-16">
        <FaqList />
        <p className="mt-10 text-muted-foreground">
          Something else? <Link to="/contact" className="text-foreground underline decoration-signal underline-offset-4">Contact the organisers</Link>.
        </p>
      </Container>
    </>
  );
}
