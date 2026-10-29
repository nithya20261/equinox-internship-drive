import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Shield, Lock } from "lucide-react";
import { Container, Eyebrow, Reveal, SectionHead } from "@/components/site/primitives";
import { Journey } from "@/components/site/blocks";
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
        <Hero />
        <WhatIs />
        <IdentityShield />
        <HowItWorks />
        <FinalCta />
      </div>
    </div>
  );
}

function Hero() {
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
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">
            OFFICIAL SUMMIT DRIVE
          </span>
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

        {/* Hero Narrative & Action */}
        <div className="mt-10 max-w-2xl">
          <p className="text-lg sm:text-xl leading-relaxed text-[#F7F2F6]/90 font-sans">
            Two days on campus connecting MLRIT students directly with founders and hiring teams.
            Merit-first evaluation, structured screening, and immediate internship shortlists.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/internships" className="btn btn-signal h-11 px-6 text-sm font-semibold">
              Explore Opportunities <ArrowRight className="h-4 w-4" />
            </Link>
            {!isLoggedIn && (
              <Link to="/login" className="btn btn-line h-11 px-6 text-sm font-semibold">
                Log in
              </Link>
            )}
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
            <div className="mt-8 border-t border-white/20 pt-8 max-w-2xl">
              <p className="font-sans text-base text-[#F7F2F6]/75 leading-relaxed">
                Organised by the Centre for Innovation &amp; Entrepreneurship at MLRIT, the Internship Drive
                enables tech and business talent to interact face-to-face with founders and engineering leaders.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-[#2A2A2A] riso-texture">
      <Container>
        <SectionHead index="02" label="How It Works" title="Candidate Journey">
          Follow the structured four-step path from student registration to role applications.
        </SectionHead>
        <div className="mt-12">
          <Journey />
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
          <Link to="/internships" className="btn btn-signal h-12 px-8 text-base font-semibold">
            Explore Opportunities <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="btn btn-line h-12 px-8 text-base font-semibold">
            Candidate Login
          </Link>
        </div>
      </Container>
    </section>
  );
}
