import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { Container, Eyebrow, PageHero } from "@/components/site/primitives";
import { CtaPair, Journey } from "@/components/site/blocks";

export const Route = createFileRoute("/how-it-works")({
  head: () => pageMeta("How It Works", "How students and companies take part in the Equinox 2K26 Internship Drive — from registration to tracking applications."),
  component: How,
});

const COMPANY = ["Register", "Create company profile", "Post internship", "View applicants", "Manage candidates"];

function How() {
  return (
    <>
      <PageHero label="How it works" title={<>Five steps.<br />One platform.</>}>
        The flow for students below. Exact dates and requirements will be announced soon.
      </PageHero>
      <Container className="py-20">
        <Eyebrow index="A">For students</Eyebrow>
        <div className="mt-8"><Journey /></div>
        <div className="mt-24 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Eyebrow index="B">For companies & startups</Eyebrow>
            <h2 className="headline mt-6 text-4xl">Hiring at Equinox</h2>
          </div>
          <ol className="border-t border-foreground md:col-span-8">
            {COMPANY.map((s, i) => (
              <li key={s} className="flex items-baseline gap-6 border-b border-border py-5">
                <span className="eyebrow text-signal">{String(i + 1).padStart(2, "0")}</span>
                <span className="headline text-2xl">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-20"><CtaPair /></div>
      </Container>
    </>
  );
}
