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
      k: "The Equinox 2.0",
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
    <div className="riso-texture brochure-grid min-h-screen">
      <PageHero
        label="About &amp; How It Works"
        title={
          <>
            Where ideas<br />meet industry.
          </>
        }
      >
        {EVENT.stats[0].value} students and {EVENT.stats[1].value} startups expected on 30 &amp; 31 October at MLRIT Hyderabad. Explore the summit background and the simple step-by-step process for students and companies.
      </PageHero>

      {/* Part 1: About the Summit & Organizers */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mb-12 border-b border-white/20 pb-4">
            <Eyebrow index="01">The Summit &amp; Organisers</Eyebrow>
            <h2 className="font-display-title mt-4 text-3xl sm:text-4xl md:text-5xl uppercase text-[#F7F2F6]">
              Built by CIE at MLRIT
            </h2>
          </div>

          <div className="space-y-4">
            {blocks.map((b, i) => (
              <Reveal key={b.k}>
                <div className="rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 p-6 sm:p-8 shadow-[4px_4px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs grid gap-6 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-4">
                    <Eyebrow index={String(i + 1).padStart(2, "0")}>{b.k}</Eyebrow>
                  </div>
                  <p className="font-sans text-base sm:text-lg md:col-span-8 text-white/90 leading-relaxed">
                    {b.v}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {EVENT.stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs"
              >
                <p className="font-display-title text-4xl sm:text-5xl text-[#33FF67]">{s.value}</p>
                <p className="font-sans mt-2 text-sm text-white/80 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Part 2: How It Works */}
      <section className="border-t border-white/20 bg-[#151515] brochure-grid-dense py-16 sm:py-20">
        <Container>
          <div className="border-b border-white/20 pb-4">
            <Eyebrow index="02">Process &amp; Journey</Eyebrow>
            <h2 className="font-display-title mt-4 text-3xl sm:text-4xl md:text-5xl uppercase text-[#F7F2F6]">
              Five steps. One platform.
            </h2>
            <p className="mt-2 font-sans text-sm sm:text-base text-white/70">
              Everything students and companies need to know to participate seamlessly.
            </p>
          </div>

          {/* For Students */}
          <div className="mt-12">
            <Eyebrow index="A">For Students</Eyebrow>
            <div className="mt-6">
              <Journey />
            </div>
          </div>

          {/* For Companies */}
          <div className="mt-16 grid gap-8 md:grid-cols-12 md:items-start">
            <div className="md:col-span-4 rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.35)]">
              <Eyebrow index="B">For Companies &amp; Startups</Eyebrow>
              <h3 className="font-display-title mt-4 text-2xl uppercase text-[#F7F2F6]">
                Hiring at Equinox
              </h3>
              <p className="mt-3 font-sans text-sm text-white/70 leading-relaxed">
                Meet motivated candidates face-to-face on campus. Evaluate resumes, conduct in-person interviews, and recruit the right fit.
              </p>
            </div>
            <ol className="md:col-span-8 rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.35)] divide-y divide-white/10">
              {COMPANY_STEPS.map((step, idx) => (
                <li
                  key={step}
                  className="flex items-baseline gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <span className="font-mono text-xs font-bold text-[#7484FE]">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="font-sans text-sm sm:text-base text-white/90 font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-12 border-t border-white/20 pt-8">
            <CtaPair />
          </div>
        </Container>
      </section>
    </div>
  );
}
