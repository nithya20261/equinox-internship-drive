import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Shield, Lock, RotateCcw } from "lucide-react";
import { DRIVE_STATS, EVENT } from "@/data/site";
import { Container, Eyebrow, Reveal, SectionHead, TbaBadge } from "@/components/site/primitives";
import { Journey, ListingAnatomy, OpportunitySlot } from "@/components/site/blocks";
import { CinematicIntro } from "@/components/site/CinematicIntro";
import { useAuth } from "@/lib/auth";

const TITLE = "The Equinox E-Summit 2K26 · Internship Drive";
const DESC = "Equinox E-Summit 2K26 Internship Drive at MLRIT Hyderabad. 30–31 October. Connecting students with high-growth startups and tech companies.";

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
  const [showIntro, setShowIntro] = useState<boolean>(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    window.scrollTo(0, 0);
    setShowIntro(true);
  };

  return (
    <div className="relative min-h-screen">
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      <div
        className={`relative transition-opacity duration-700 ease-in-out ${
          showIntro
            ? "opacity-0 pointer-events-none select-none h-screen overflow-hidden"
            : "opacity-100"
        }`}
      >
        <Hero onReplayIntro={handleReplayIntro} />
        <WhatIs />
        <IdentityShield />
        <Why />
        <Opportunities />
        <Companies />
        <HowItWorks />
        <Scale />
        <AboutEquinox />
        <Cie />
        <FinalCta />
      </div>
    </div>
  );
}

function Hero({ onReplayIntro }: { onReplayIntro: () => void }) {
  const { isLoggedIn } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-white/20 bg-[#151515] pt-8 pb-16 md:pt-12 md:pb-24 brochure-grid-dense">
      {/* Background Cyber Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-[#7484FE]/15 via-[#33FF67]/10 to-transparent blur-3xl pointer-events-none" />

      <Container className="relative z-10">
        {/* Top Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="pulse-dot h-2 w-2 rounded-full bg-[#33FF67]" aria-hidden />
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#7484FE]">CIE @ MLRIT PRESENTS</span>
          </div>
          <button
            onClick={onReplayIntro}
            className="flex items-center gap-1.5 font-sans text-xs text-[#F7F2F6]/70 hover:text-[#33FF67] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Replay Cinematic Intro
          </button>
        </div>

        {/* Hero Branding with Official Equinox Logo */}
        <div className="mt-8 md:mt-12 flex flex-col items-start">
          <img
            src="/equinox-logo.svg"
            alt="The Equinox 2.0 E-Summit 2K26"
            width="560"
            height="235"
            className="w-full max-w-[280px] sm:max-w-[420px] md:max-w-[520px] lg:max-w-[600px] h-auto object-contain drop-shadow-[0_10px_30px_rgba(116,132,254,0.25)]"
          />

          {/* INTERNSHIP DRIVE Pill Headline */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#33FF67] bg-[#33FF67]/15 px-4 py-1.5 font-display text-base sm:text-xl font-bold tracking-wider text-[#33FF67] uppercase shadow-[0_0_20px_rgba(51,255,103,0.2)]">
              INTERNSHIP DRIVE
            </span>
            <span className="font-mono text-xs sm:text-sm text-[#F7F2F6]/75 uppercase tracking-wider font-medium">
              30–31 OCTOBER · MLRIT HYDERABAD
            </span>
          </div>
        </div>

        {/* Hero Narrative & Action Grid */}
        <div className="mt-10 grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="text-lg sm:text-xl leading-relaxed text-[#F7F2F6]/90 font-sans">
              Two days on campus connecting MLRIT students directly with founders and hiring teams.
              Merit-first evaluation, structured screening, and immediate internship shortlists.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/internships" className="btn btn-signal h-11 px-6 text-sm font-semibold">
                Explore Opportunities <ArrowRight className="h-4 w-4" />
              </Link>
              {!isLoggedIn ? (
                <Link to="/register" className="btn btn-line h-11 px-6 text-sm font-semibold">
                  Register as Candidate
                </Link>
              ) : (
                <Link to="/dashboard/student" className="btn btn-line h-11 px-6 text-sm font-semibold">
                  Open Student Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="md:col-span-5 md:col-start-8">
            <dl className="grid grid-cols-2 border-t border-white/20">
              {[
                ["Dates", "30–31 October"],
                ["Venue", "MLRIT · Hyderabad"],
                ["Target", "2000+ Students"],
                ["Host", "CIE @ MLRIT"],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-white/20 py-3.5 pr-4">
                  <dt className="font-mono text-xs uppercase tracking-wider text-[#7484FE] font-bold">{k}</dt>
                  <dd className="font-display-title mt-0.5 text-base sm:text-lg uppercase text-[#F7F2F6]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}

function IdentityShield() {
  return (
    <section className="border-b border-white/20 bg-[#2A2A2A] py-8 riso-texture">
      <Container>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-2 border-white/20 bg-[#151515]/90 p-6 md:p-8 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#33FF67] bg-[#33FF67]/15 text-[#33FF67]">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#33FF67]">
                  CONFIDENTIALITY PROTOCOL
                </span>
                <span className="rounded bg-[#2A2A2A] px-2 py-0.5 font-mono text-[10px] text-[#F7F2F6]/75">
                  RECRUITER ANONYMITY
                </span>
              </div>
              <h3 className="font-sans mt-1 text-xl md:text-2xl font-bold text-[#F7F2F6]">
                Company Identities are Shielded from Candidates
              </h3>
              <p className="mt-1 font-sans text-sm text-[#F7F2F6]/70 max-w-2xl leading-relaxed">
                To guarantee unbiased, merit-based hiring, organization names remain anonymous during initial discovery and submission. Complete company details are disclosed only after recruiter shortlisting.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 font-sans text-xs font-semibold text-[#7484FE] border border-[#7484FE]/30 px-3.5 py-2 rounded-full bg-[#7484FE]/10">
            <Lock className="h-3.5 w-3.5" /> Confidential Hiring Format
          </div>
        </div>
      </Container>
    </section>
  );
}

function WhatIs() {
  return (
    <section className="py-20 md:py-28 bg-[#2A2A2A] riso-texture">
      <Container>
        <div className="grid gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-3">
            <Eyebrow index="01">The Drive</Eyebrow>
          </div>
          <div className="md:col-span-9">
            <Reveal>
              <h2 className="font-display-title text-3xl sm:text-4xl md:text-5xl uppercase text-[#F7F2F6] leading-tight">
                Students meet <span className="text-[#33FF67]">startups</span> hiring for real internships — at one flagship summit.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-8 border-t border-white/20 pt-8 md:grid-cols-2">
              <p className="font-sans text-base text-[#F7F2F6]/75 leading-relaxed">
                Organised by the Centre for Innovation &amp; Entrepreneurship at MLRIT, the Internship Drive
                enables tech and business talent to interact face-to-face with founders and engineering leaders.
              </p>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-[#7484FE] font-bold mb-3">
                  Standardised Listing Format
                </p>
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
    <section className="bg-[#151515] py-20 border-y border-white/20 brochure-grid-dense">
      <Container>
        <div className="grid gap-6 border-t border-white/20 pt-6 md:grid-cols-12 md:items-start">
          <div className="md:col-span-3">
            <Eyebrow index="02" className="text-[#7484FE]">Key Metrics</Eyebrow>
          </div>
          <h2 className="font-display-title text-3xl sm:text-4xl md:text-5xl md:col-span-9 uppercase text-[#F7F2F6]">
            One campus. Two days. Real hiring.
          </h2>
        </div>

        {/* Stats Grid with clamp sizing, aligned baselines, and equal padding */}
        <div className="mt-12 grid border-2 border-white/20 sm:grid-cols-2 lg:grid-cols-4 bg-[#2A2A2A]/90 rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-white/20 shadow-[4px_4px_0px_rgba(0,0,0,0.35)]">
          {DRIVE_STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col justify-between p-6 sm:p-7 md:p-8"
            >
              <div className="h-12 sm:h-14 flex items-center">
                <p className="text-[clamp(1.75rem,3.2vw,3rem)] font-bold tracking-tight text-[#33FF67] font-display-title whitespace-nowrap leading-none">
                  {s.value}
                </p>
              </div>
              <div className="mt-6 flex-1 flex flex-col justify-start">
                <p className="font-sans text-base font-semibold text-[#F7F2F6]">{s.label}</p>
                <p className="mt-2 font-sans text-sm text-[#F7F2F6]/65 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Opportunities() {
  const { isLoggedIn } = useAuth();

  return (
    <section className="py-20 md:py-28 bg-[#2A2A2A] riso-texture">
      <Container>
        <SectionHead index="03" label="Opportunities" title="Internship Board">
          Participating companies and roles are in finalisation. Full specifications remain confidential until published.
        </SectionHead>

        {!isLoggedIn && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#7484FE]/40 bg-[#7484FE]/10 p-4 font-sans text-sm text-[#F7F2F6]">
            <Lock className="h-4 w-4 text-[#7484FE] shrink-0" />
            <span>Opportunity details and candidate applications require student authentication.</span>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((n) => (
            <OpportunitySlot key={n} n={n} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/internships" className="btn btn-signal h-11 px-6 text-sm font-semibold">
            View All Opportunities <ArrowRight size={16} />
          </Link>
          {!isLoggedIn && (
            <Link to="/login" className="btn btn-line h-11 px-6 text-sm font-semibold">
              Log in to Unlock Details
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}

function Companies() {
  return (
    <section className="border-y border-white/20 bg-[#151515] py-20 md:py-28 brochure-grid-dense">
      <Container>
        <SectionHead index="04" label="Recruiters & Startups" title="Confidential Slots">
          Hiring organisations are assigned anonymous slots. Identities are revealed upon interview invitation.
        </SectionHead>

        <div className="mt-12 grid grid-cols-2 border-l border-t border-white/20 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex aspect-[4/3] flex-col items-center justify-center border-b border-r border-white/20 bg-[#2A2A2A]/80 p-4 text-center transition-colors hover:border-[#7484FE]"
            >
              <Shield className="h-5 w-5 text-[#7484FE]/70 mb-2" />
              <span className="font-mono text-xs font-bold text-[#F7F2F6]">
                SLOT {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-[10px] text-[#33FF67] font-semibold mt-1">CONFIDENTIAL</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <TbaBadge>15+ Stealth Organisations Enrolled</TbaBadge>
          <Link to="/register" className="btn btn-line h-11 px-5 text-sm font-semibold">
            Register as Hiring Partner <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-[#2A2A2A] riso-texture">
      <Container>
        <SectionHead index="05" label="How It Works" title="Candidate Journey">
          Follow the structured five-step path from student registration to on-campus interviews.
        </SectionHead>
        <div className="mt-12">
          <Journey />
        </div>
      </Container>
    </section>
  );
}

function Scale() {
  return (
    <section className="border-t border-white/20 bg-[#151515] py-20 brochure-grid-dense">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:items-start">
          <div className="md:col-span-6">
            <Eyebrow index="06">Summit Scale</Eyebrow>
            <h2 className="font-display-title mt-4 text-3xl sm:text-4xl md:text-5xl uppercase text-[#F7F2F6]">
              A proven track record of student empowerment.
            </h2>
          </div>
          <div className="md:col-span-6 border-l border-white/20 pl-6 md:pl-10">
            <p className="font-sans text-base text-[#F7F2F6]/75 leading-relaxed">
              Equinox E-Summit has become one of Telangana's most celebrated student entrepreneurship summits.
              The 2026 edition scales to 2000+ expected attendees with dedicated face-to-face recruitment tracks.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function AboutEquinox() {
  return (
    <section className="border-t border-white/20 bg-[#2A2A2A] py-20 riso-texture">
      <Container>
        <div className="grid gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-4">
            <Eyebrow index="07">The Summit</Eyebrow>
            <h2 className="font-display-title mt-4 text-3xl md:text-4xl uppercase text-[#F7F2F6]">
              Equinox E-Summit 2K26
            </h2>
          </div>
          <div className="md:col-span-8 text-[#F7F2F6]/75 font-sans text-base leading-relaxed space-y-4">
            <p>
              Held at MLR Institute of Technology, Hyderabad, on 30 &amp; 31 October. The summit features keynote panels, founder showcases, hackathons, and the exclusive Internship Drive.
            </p>
            <Link to="/about" className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-[#33FF67] hover:underline">
              Read complete summit background &amp; how it works <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Cie() {
  return (
    <section className="border-t border-white/20 bg-[#151515] py-20 brochure-grid-dense">
      <Container className="grid gap-10 md:grid-cols-12 md:items-start">
        <div className="md:col-span-4 border-r border-white/20 pr-6">
          <span className="font-mono text-xs uppercase tracking-wider text-[#7484FE] font-bold">Est. 2015</span>
          <p className="font-display-title mt-2 text-6xl text-[#33FF67]">CIE</p>
          <p className="font-sans text-sm text-[#F7F2F6]/70 mt-3">Centre for Innovation &amp; Entrepreneurship · MLRIT</p>
        </div>
        <div className="md:col-span-8">
          <Eyebrow index="08">The Organisers</Eyebrow>
          <h2 className="font-display-title mt-4 text-3xl md:text-4xl uppercase text-[#F7F2F6]">
            Nurturing Next-Generation Innovators
          </h2>
          <p className="mt-4 font-sans text-base text-[#F7F2F6]/75 leading-relaxed">
            Established in 2015, CIE supports entrepreneurship development, early-stage ventures, and the startup ecosystem at MLRIT. The Internship Drive is engineered to place emerging talent into high-impact environments.
          </p>
        </div>
      </Container>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-white/20 bg-[#151515] py-20 md:py-28 text-[#F7F2F6] brochure-grid-dense">
      <Container className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[#33FF67] font-bold">
          30–31 OCTOBER 2026 · MLRIT HYDERABAD
        </p>
        <h2 className="font-display-title mt-6 max-w-4xl mx-auto text-[clamp(1.75rem,5.5vw,4.5rem)] leading-[1.1] tracking-tight uppercase text-[#F7F2F6] px-4">
          Your next opportunity starts at Equinox.
        </h2>
        <p className="mt-6 font-sans text-base sm:text-lg text-[#F7F2F6]/75 max-w-2xl mx-auto leading-relaxed">
          Open to all eligible students. Submit your credentials once, apply to multiple participating companies, and track interview shortlists.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/register" className="btn btn-signal h-12 px-8 text-base font-semibold">
            Register as Candidate <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/internships" className="btn btn-line h-12 px-8 text-base font-semibold">
            Browse Opportunities
          </Link>
        </div>
      </Container>
    </section>
  );
}
