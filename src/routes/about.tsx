import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { EVENT } from "@/data/site";
import { Container, Eyebrow, PageHero, Reveal } from "@/components/site/primitives";
import { CtaPair, Journey } from "@/components/site/blocks";

export const Route = createFileRoute("/about")({
  head: () =>
    pageMeta(
      "About & How It Works",
      "Learn about Equinox E-Summit 2K26, the Internship Drive at MLRIT, and how students and companies participate — from registration to tracking applications."
    ),
  component: AboutPage,
});

const COMPANY_STEPS = [
  "Register organization profile",
  "Post internship requirements & eligibility",
  "Browse student profiles & resumes",
  "Shortlist candidates for on-campus interviews",
  "Extend internship offers at Equinox 2K26",
];

export function AboutPage() {
  const blocks = [
    {
      k: "Equinox E-Summit 2K26",
      v: "A premier 2-day entrepreneurship summit at MLR Institute of Technology, Hyderabad, taking place on 30 & 31 October. Students explore entrepreneurship, startups, cutting-edge innovation, real-world industry challenges and internship opportunities.",
    },
    {
      k: "The Internship Drive",
      v: "The flagship recruitment sub-event of the summit that connects ambitious students directly with high-growth startups and established companies offering real internships. Gain hands-on industry experience, build lasting professional networks, and accelerate your career.",
    },
    {
      k: "CIE @ MLRIT",
      v: "The Centre for Innovation & Entrepreneurship was established in 2015. It fuels entrepreneurship development, incubates early-stage student startups, and anchors the vibrant innovation ecosystem across MLRIT and Telangana.",
    },
  ];

  return (
    <>
      <PageHero
        label="About & How It Works"
        title={
          <>
            Where ideas<br />meet industry.
          </>
        }
      >
        {EVENT.stats[0].value} students and {EVENT.stats[1].value} startups expected on 30 & 31 October at MLRIT Hyderabad. Explore the summit background and the simple step-by-step process for students and companies.
      </PageHero>

      {/* Part 1: About the Summit & Organizers */}
      <section className="py-20">
        <Container>
          <div className="mb-12 border-b border-foreground pb-4">
            <Eyebrow index="01">The Summit & Organisers</Eyebrow>
            <h2 className="headline mt-4 text-3xl md:text-5xl">Built by CIE at MLRIT</h2>
          </div>

          <div className="space-y-0">
            {blocks.map((b, i) => (
              <Reveal key={b.k}>
                <div className="grid gap-6 border-t border-foreground py-10 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Eyebrow index={String(i + 1).padStart(2, "0")}>{b.k}</Eyebrow>
                  </div>
                  <p className="headline text-2xl md:col-span-8 md:text-3xl lg:text-4xl">
                    {b.v}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid border border-foreground sm:grid-cols-3">
            {EVENT.stats.map((s) => (
              <div
                key={s.label}
                className="border-b border-foreground p-6 sm:border-b-0 sm:border-r last:border-none"
              >
                <p className="display text-5xl text-signal md:text-6xl">{s.value}</p>
                <p className="eyebrow mt-3 text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Part 2: How It Works */}
      <section className="border-t border-border bg-paper-deep py-20">
        <Container>
          <div className="border-b border-foreground pb-4">
            <Eyebrow index="02">Process & Journey</Eyebrow>
            <h2 className="headline mt-4 text-3xl md:text-5xl">Five steps. One platform.</h2>
            <p className="mt-2 text-muted-foreground">
              Everything students and companies need to know to participate seamlessly.
            </p>
          </div>

          {/* For Students */}
          <div className="mt-14">
            <Eyebrow index="A">For Students</Eyebrow>
            <div className="mt-6">
              <Journey />
            </div>
          </div>

          {/* For Companies */}
          <div className="mt-20 grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <Eyebrow index="B">For Companies & Startups</Eyebrow>
              <h3 className="headline mt-4 text-3xl md:text-4xl">Hiring at Equinox</h3>
              <p className="mt-4 text-sm text-muted-foreground">
                Meet motivated candidates face-to-face on campus. Evaluate resumes, conduct in-person interviews, and recruit the right fit.
              </p>
            </div>
            <ol className="border-t border-foreground md:col-span-8">
              {COMPANY_STEPS.map((step, idx) => (
                <li
                  key={step}
                  className="flex items-baseline gap-6 border-b border-border py-5"
                >
                  <span className="eyebrow text-signal">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="headline text-xl md:text-2xl">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-16 border-t border-foreground pt-12">
            <CtaPair />
          </div>
        </Container>
      </section>
    </>
  );
}
