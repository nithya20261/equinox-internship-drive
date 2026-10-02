import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { DRIVE_STATS, EVENT } from "@/data/site";
import { Container, Eyebrow, Reveal, SectionHead, TbaBadge } from "@/components/site/primitives";
import { CtaPair, FaqList, Journey, ListingAnatomy, OpportunitySlot } from "@/components/site/blocks";

const TITLE = "Internship Drive — Equinox E-Summit 2K26 · MLRIT Hyderabad";
const DESC = "Meet startups and companies offering internships at Equinox E-Summit 2K26. 30–31 October at MLR Institute of Technology, Hyderabad.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <WhatIs />
      <Why />
      <Opportunities />
      <Companies />
      <HowItWorks />
      <Scale />
      <AboutEquinox />
      <Cie />
      <Faq />
      <FinalCta />
    </>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  const line = (d: number) => ({
    initial: reduce ? false : { y: "105%" },
    animate: { y: "0%" },
    transition: { duration: 0.9, delay: d, ease: [0.22, 1, 0.36, 1] as const },
  });
  return (
    <section className="relative overflow-hidden">
      <Container className="pt-10 md:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <p className="eyebrow flex items-center gap-2">
            <span className="pulse-dot h-2 w-2 rounded-full bg-signal" aria-hidden />
            {EVENT.name}
          </p>
          <p className="eyebrow text-muted-foreground">Sub-event · Industry Connect</p>
        </div>

        <h1 className="display mt-8 text-[17vw] md:text-[13.5vw] xl:text-[12.5rem]">
          <span className="block overflow-hidden"><motion.span className="block" {...line(0.05)}>Internship</motion.span></span>
          <span className="block overflow-hidden">
            <motion.span className="block" {...line(0.15)}>Drive</motion.span>
          </span>
        </h1>

        <div className="mt-10 grid gap-10 pb-16 md:grid-cols-12 md:pb-24">
          <motion.div
            className="md:col-span-6"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <p className="text-xl leading-relaxed md:text-2xl">
              Two days where MLRIT students meet the startups and companies hiring interns.
              Explore roles, connect with teams, and take the first step into industry.
            </p>
            <div className="mt-8"><CtaPair /></div>
          </motion.div>
          <motion.dl
            className="grid grid-cols-2 self-end border-t border-foreground md:col-span-5 md:col-start-8"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            {[
              ["Dates", "30–31 October"],
              ["Venue", "MLRIT · Hyderabad"],
              ["For", "Students"],
              ["Hosted by", "CIE @ MLRIT"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-border py-4 odd:pr-4">
                <dt className="eyebrow text-[0.65rem] text-muted-foreground">{k}</dt>
                <dd className="headline mt-1 text-xl uppercase">{v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </Container>
      <div className="overflow-hidden border-y border-foreground bg-ink py-3 text-ink-foreground" aria-hidden>
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-10">
              {["Explore", "Apply", "Connect", "Learn", "Grow", "30–31 Oct", "MLRIT Hyderabad", "Equinox 2K26"].map((w) => (
                <span key={w} className="eyebrow flex items-center gap-10">
                  {w} <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatIs() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3"><Eyebrow index="01">The Drive</Eyebrow></div>
          <div className="md:col-span-9">
            <Reveal>
              <p className="headline text-3xl md:text-5xl">
                Students meet <span className="text-signal">startups</span> hiring for real
                internships — at one summit.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-8 border-t border-border pt-8 md:grid-cols-2">
              <p className="text-muted-foreground">
                It is one of the major sub-events of Equinox E-Summit 2K26, organised by the Centre for
                Innovation & Entrepreneurship at MLRIT. Students discover roles; organisations meet early
                talent face to face.
              </p>
              <div>
                <p className="eyebrow mb-3 text-muted-foreground">Every listing will show</p>
                <ListingAnatomy />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Why() {
  return (
    <section className="bg-ink py-24 text-ink-foreground md:py-32">
      <Container>
        <div className="grid gap-6 border-t border-ink-foreground pt-6 md:grid-cols-12">
          <div className="md:col-span-3"><Eyebrow index="02" className="text-ink-muted">On the record</Eyebrow></div>
          <h2 className="headline text-4xl md:col-span-9 md:text-6xl">One campus. Two days. Real hiring.</h2>
        </div>
        <div className="mt-16 grid border border-ink-border sm:grid-cols-2 lg:grid-cols-4">
          {DRIVE_STATS.map((s) => (
            <div key={s.label} className="group flex flex-col gap-16 border-ink-border p-6 max-sm:border-b max-sm:last:border-b-0 sm:border-r sm:odd:border-r sm:last:border-r-0 lg:border-r lg:last:border-r-0">
              <p className="display text-5xl text-signal md:text-6xl">{s.value}</p>
              <div>
                <p className="eyebrow text-ink-foreground">{s.label}</p>
                <p className="mt-2 text-sm text-ink-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-ink-muted">
          The Internship Drive sits inside Equinox E-Summit 2K26 — recruiters and founders meet candidates face to
          face, on campus, over two days.
        </p>
      </Container>
    </section>
  );
}

function Opportunities() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <SectionHead index="03" label="Opportunities" title="Roles are being finalised.">
          Participating companies and roles will appear here soon. This is how each listing will look.
        </SectionHead>
        <div className="mt-14 border-t border-foreground">
          {[1, 2, 3].map((n) => <OpportunitySlot key={n} n={n} />)}
        </div>
        <Link to="/internships" className="btn btn-line mt-10">
          Open the opportunities board <ArrowRight size={16} />
        </Link>
      </Container>
    </section>
  );
}

function Companies() {
  return (
    <section className="border-y border-border bg-paper-deep py-24 md:py-32">
      <Container>
        <SectionHead index="04" label="Companies & startups" title="Who's hiring">
          Participating companies will be announced soon.
        </SectionHead>
        <div className="mt-14 grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="hatch flex aspect-[4/3] items-center justify-center border-b border-r border-border">
              <span className="eyebrow bg-paper-deep px-2 text-muted-foreground">Slot {String(i + 1).padStart(2, "0")}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <TbaBadge>Announcement pending</TbaBadge>
          <Link to="/companies" className="btn btn-line">Company directory <ArrowRight size={16} /></Link>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <SectionHead index="05" label="How it works" title="From sign-up to status, in five steps." />
        <div className="mt-14"><Journey /></div>
      </Container>
    </section>
  );
}

function Scale() {
  return (
    <section className="bg-signal py-24 text-signal-foreground md:py-32">
      <Container>
        <Eyebrow index="06" className="text-signal-foreground">Event scale</Eyebrow>
        <div className="mt-10 grid border-t border-signal-foreground/40 md:grid-cols-3">
          {EVENT.stats.map((s) => (
            <Reveal key={s.label} className="border-b border-signal-foreground/40 py-8 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0">
              <p className="display text-8xl md:text-[9rem]">{s.value}</p>
              <p className="eyebrow mt-4">{s.label}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-12 max-w-xl text-lg">
          The previous edition drew {EVENT.previousEdition} participants. 2K26 is planned to be bigger.
        </p>
      </Container>
    </section>
  );
}

function AboutEquinox() {
  return (
    <section className="py-24 md:py-32">
      <Container className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Eyebrow index="07">About Equinox</Eyebrow>
          <h2 className="display mt-6 text-7xl md:text-9xl">Equi<br />nox<span className="text-signal">.</span></h2>
        </div>
        <div className="space-y-6 md:col-span-6 md:col-start-7 md:pt-16">
          <Reveal>
            <p className="headline text-2xl md:text-3xl">
              A 2-day E-Summit at MLRIT Hyderabad where students explore entrepreneurship, innovation and real-world challenges.
            </p>
          </Reveal>
          <p className="text-muted-foreground">
            Equinox brings students together with startups and industry. The Internship Drive is one of several
            sub-events — the one focused on turning interest into opportunity.
          </p>
          <Link to="/about" className="btn btn-line">More about the summit <ArrowUpRight size={16} /></Link>
        </div>
      </Container>
    </section>
  );
}

function Cie() {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <Container className="grid gap-10 md:grid-cols-12">
        <div className="border border-foreground p-8 md:col-span-4">
          <p className="eyebrow text-muted-foreground">Est.</p>
          <p className="display mt-2 text-8xl">2015</p>
          <p className="eyebrow mt-8">CIE @ MLRIT</p>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <Eyebrow index="08">The organisers</Eyebrow>
          <h2 className="headline mt-6 text-4xl md:text-5xl">Centre for Innovation & Entrepreneurship</h2>
          <p className="lede mt-6">
            Established in 2015, CIE supports entrepreneurship development, early-stage startups and the innovation
            ecosystem at MLR Institute of Technology. Equinox is its flagship summit.
          </p>
        </div>
      </Container>
    </section>
  );
}

function Faq() {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <Container className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <Eyebrow index="09">FAQ</Eyebrow>
          <h2 className="headline mt-6 text-4xl md:text-5xl">Questions, answered honestly.</h2>
          <p className="mt-4 text-muted-foreground">Where details aren't final, we say so.</p>
          <Link to="/faq" className="btn btn-line mt-8">All questions <ArrowRight size={16} /></Link>
        </div>
        <div className="md:col-span-8"><FaqList limit={6} /></div>
      </Container>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="grid-lines border-t border-foreground bg-ink py-24 text-ink-foreground md:py-36">
      <Container>
        <p className="eyebrow text-signal">30–31 October · MLRIT</p>
        <h2 className="display mt-6 max-w-5xl text-6xl md:text-9xl">Your next opportunity could start here.</h2>
        <div className="mt-12"><CtaPair inverse /></div>
      </Container>
    </section>
  );
}
