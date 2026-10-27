import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Shield, Lock, RotateCcw } from "lucide-react";
import { DRIVE_STATS, EVENT } from "@/data/site";
import { Container, Eyebrow, Reveal, SectionHead, TbaBadge } from "@/components/site/primitives";
import { CtaPair, Journey, ListingAnatomy, OpportunitySlot } from "@/components/site/blocks";
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

  useEffect(() => {
    if (sessionStorage.getItem("equinox_intro_seen") === "true") {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem("equinox_intro_seen", "true");
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  if (showIntro) {
    return <CinematicIntro onComplete={handleIntroComplete} />;
  }

  return (
    <div className="animate-in fade-in duration-700">
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
  );
}

function Hero({ onReplayIntro }: { onReplayIntro: () => void }) {
  const { isLoggedIn } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-[#2A2A2A] bg-black pt-8 pb-20 md:pt-14 md:pb-28">
      {/* Background Cyber Ambient Glow & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A2A2A14_1px,transparent_1px),linear-gradient(to_bottom,#2A2A2A14_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#7484FE]/15 via-[#33FF67]/10 to-transparent blur-3xl pointer-events-none" />

      <Container className="relative z-10">
        {/* Top Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#7484FE]">
            <span className="pulse-dot h-2 w-2 rounded-full bg-[#33FF67]" aria-hidden />
            <span className="tracking-widest uppercase font-semibold">CIE @ MLRIT PRESENTS</span>
          </div>
          <button
            onClick={onReplayIntro}
            className="flex items-center gap-1.5 font-mono text-[11px] text-[#F7F2F6]/60 hover:text-[#33FF67] transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Replay Cinematic Intro
          </button>
        </div>

        {/* Hero Branding matching the reference image */}
        <div className="mt-10 md:mt-14 flex flex-col items-start">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm sm:text-base font-bold tracking-[0.3em] text-[#7484FE] uppercase">
              THE
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-gradient-to-r from-[#7484FE] to-[#33FF67] px-3 py-0.5 font-mono text-xs font-bold text-black shadow-[0_0_15px_rgba(51,255,103,0.3)]">
              <Sparkles className="h-3 w-3 fill-black" /> 2nd Edition
            </span>
          </div>

          {/* EQUINOX Title */}
          <h1 className="mt-2 font-display font-black tracking-tighter text-6xl sm:text-8xl md:text-9xl lg:text-[11.5rem] leading-none text-[#F7F2F6]">
            EQUINOX
          </h1>

          {/* E-SUMMIT 2K26 gradient */}
          <div className="font-display font-black tracking-widest text-3xl sm:text-5xl md:text-6xl lg:text-7xl uppercase bg-gradient-to-r from-[#7484FE] via-[#33FF67] to-[#7484FE] bg-clip-text text-transparent">
            E-SUMMIT 2K26
          </div>

          {/* INTERNSHIP DRIVE Pill Headline */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="border border-[#33FF67] bg-[#33FF67]/10 px-4 py-1.5 font-display text-lg sm:text-2xl font-bold tracking-widest text-[#33FF67] uppercase shadow-[0_0_20px_rgba(51,255,103,0.2)]">
              INTERNSHIP DRIVE
            </span>
            <span className="font-mono text-xs sm:text-sm text-[#F7F2F6]/60 uppercase tracking-widest">
              30–31 OCTOBER · MLRIT HYDERABAD
            </span>
          </div>
        </div>

        {/* Hero Narrative & Action Grid */}
        <div className="mt-12 grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="text-xl sm:text-2xl leading-relaxed text-[#F7F2F6]/90 font-sans">
              Two days on campus connecting MLRIT students directly with founders and hiring teams.
              Merit-first evaluation, structured screening, and immediate internship shortlists.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/internships" className="btn btn-signal h-12 px-6">
                Explore Opportunities <ArrowRight className="h-4 w-4" />
              </Link>
              {!isLoggedIn ? (
                <Link to="/register" className="btn btn-line h-12 px-6">
                  Register as Candidate
                </Link>
              ) : (
                <Link to="/dashboard/student" className="btn btn-line h-12 px-6">
                  Open Student Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="md:col-span-5 md:col-start-8">
            <dl className="grid grid-cols-2 border-t border-[#2A2A2A]">
              {[
                ["Dates", "30–31 October"],
                ["Venue", "MLRIT · Hyderabad"],
                ["Target", "2000+ Students"],
                ["Host", "CIE @ MLRIT"],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-[#2A2A2A] py-3.5 pr-4">
                  <dt className="eyebrow text-[0.62rem] text-[#7484FE]">{k}</dt>
                  <dd className="headline mt-0.5 text-lg uppercase text-[#F7F2F6]">{v}</dd>
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
    <section className="border-b border-[#2A2A2A] bg-[#0A0A0A] py-8">
      <Container>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#2A2A2A] bg-black p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#33FF67] bg-[#33FF67]/10 text-[#33FF67]">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#33FF67]">
                  CONFIDENTIALITY PROTOCOL
                </span>
                <span className="rounded bg-[#2A2A2A] px-2 py-0.5 font-mono text-[10px] text-[#F7F2F6]/70">
                  RECRUITER ANONYMITY
                </span>
              </div>
              <h3 className="headline mt-1 text-xl md:text-2xl text-[#F7F2F6]">
                Company Identities are Shielded from Candidates
              </h3>
              <p className="mt-1 text-sm text-[#F7F2F6]/60 max-w-2xl">
                To guarantee unbiased, merit-based hiring, organization names remain anonymous during initial discovery and submission. Complete company details are disclosed only after recruiter shortlisting.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 font-mono text-xs text-[#7484FE] border border-[#2A2A2A] px-4 py-2 bg-[#2A2A2A]/40">
            <Lock className="h-3.5 w-3.5" /> Admin Access Restricted
          </div>
        </div>
      </Container>
    </section>
  );
}

function WhatIs() {
  return (
    <section className="py-20 md:py-28 bg-black">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <Eyebrow index="01">The Drive</Eyebrow>
          </div>
          <div className="md:col-span-9">
            <Reveal>
              <p className="headline text-3xl md:text-5xl text-[#F7F2F6]">
                Students meet <span className="text-[#33FF67]">startups</span> hiring for real
                internships — at one flagship summit.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-8 border-t border-[#2A2A2A] pt-8 md:grid-cols-2">
              <p className="text-sm sm:text-base text-[#F7F2F6]/70 leading-relaxed">
                Organised by the Centre for Innovation & Entrepreneurship at MLRIT, the Internship Drive
                enables tech and business talent to interact face-to-face with founders and engineering leaders.
              </p>
              <div>
                <p className="eyebrow mb-3 text-[#7484FE]">Standardised Listing Format</p>
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
    <section className="bg-black py-20 border-y border-[#2A2A2A]">
      <Container>
        <div className="grid gap-6 border-t border-[#2A2A2A] pt-6 md:grid-cols-12">
          <div className="md:col-span-3">
            <Eyebrow index="02" className="text-[#7484FE]">Key Metrics</Eyebrow>
          </div>
          <h2 className="headline text-4xl md:col-span-9 md:text-5xl text-[#F7F2F6]">
            One campus. Two days. Real hiring.
          </h2>
        </div>

        <div className="mt-14 grid border border-[#2A2A2A] sm:grid-cols-2 lg:grid-cols-4 bg-[#0A0A0A]">
          {DRIVE_STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col justify-between p-6 border-b border-[#2A2A2A] sm:border-r last:border-b-0 lg:border-b-0"
            >
              <p className="display text-5xl md:text-6xl text-[#33FF67]">{s.value}</p>
              <div className="mt-8">
                <p className="eyebrow text-[#F7F2F6]">{s.label}</p>
                <p className="mt-2 text-xs text-[#F7F2F6]/60 leading-relaxed">{s.body}</p>
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
    <section className="py-20 md:py-28 bg-black">
      <Container>
        <SectionHead index="03" label="Opportunities" title="Internship Board">
          Participating companies and roles are in finalisation. Full specifications remain confidential until published.
        </SectionHead>

        {!isLoggedIn && (
          <div className="mt-8 flex items-center gap-3 border border-[#7484FE] bg-[#7484FE]/10 p-4 text-xs font-mono text-[#F7F2F6]">
            <Lock className="h-4 w-4 text-[#7484FE] shrink-0" />
            <span>Opportunity details and candidate applications require student authentication.</span>
          </div>
        )}

        <div className="mt-8 border-t border-[#2A2A2A]">
          {[1, 2, 3].map((n) => (
            <OpportunitySlot key={n} n={n} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/internships" className="btn btn-signal">
            View All Opportunities <ArrowRight size={16} />
          </Link>
          {!isLoggedIn && (
            <Link to="/login" className="btn btn-line">
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
    <section className="border-y border-[#2A2A2A] bg-[#0A0A0A] py-20 md:py-28">
      <Container>
        <SectionHead index="04" label="Recruiters & Startups" title="Confidential Slots">
          Hiring organisations are assigned anonymous slots. Identities are revealed upon interview invitation.
        </SectionHead>

        <div className="mt-12 grid grid-cols-2 border-l border-t border-[#2A2A2A] sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex aspect-[4/3] flex-col items-center justify-center border-b border-r border-[#2A2A2A] bg-black p-4 text-center transition-colors hover:border-[#7484FE]"
            >
              <Shield className="h-5 w-5 text-[#7484FE]/60 mb-2" />
              <span className="font-mono text-[11px] font-bold text-[#F7F2F6]">
                SLOT {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-[9px] text-[#33FF67] mt-1">CONFIDENTIAL</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <TbaBadge>15+ Stealth Organisations Enrolled</TbaBadge>
          <Link to="/register" className="btn btn-line">
            Register as Hiring Partner <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-black">
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
    <section className="border-t border-[#2A2A2A] bg-black py-20">
      <Container>
        <div className="grid gap-8 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <Eyebrow index="06">Summit Scale</Eyebrow>
            <h2 className="headline mt-4 text-4xl md:text-5xl text-[#F7F2F6]">
              A proven track record of student empowerment.
            </h2>
          </div>
          <div className="md:col-span-6 border-l border-[#2A2A2A] pl-6 md:pl-10">
            <p className="text-base text-[#F7F2F6]/70 leading-relaxed">
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
    <section className="border-t border-[#2A2A2A] bg-[#0A0A0A] py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Eyebrow index="07">The Summit</Eyebrow>
            <h2 className="headline mt-4 text-3xl md:text-4xl text-[#F7F2F6]">
              Equinox E-Summit 2K26
            </h2>
          </div>
          <div className="md:col-span-8 text-[#F7F2F6]/70 leading-relaxed space-y-4">
            <p>
              Held at MLR Institute of Technology, Hyderabad, on 30 & 31 October. The summit features keynote panels, founder showcases, hackathons, and the exclusive Internship Drive.
            </p>
            <Link to="/about" className="inline-flex items-center gap-2 font-mono text-xs text-[#33FF67] hover:underline">
              Read complete summit background & how it works <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Cie() {
  return (
    <section className="border-t border-[#2A2A2A] bg-black py-20">
      <Container className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4 border-r border-[#2A2A2A] pr-6">
          <span className="eyebrow text-[#7484FE]">Est. 2015</span>
          <p className="display mt-2 text-7xl text-[#33FF67]">CIE</p>
          <p className="eyebrow mt-4 text-[#F7F2F6]/60">Centre for Innovation & Entrepreneurship · MLRIT</p>
        </div>
        <div className="md:col-span-8">
          <Eyebrow index="08">The Organisers</Eyebrow>
          <h2 className="headline mt-4 text-3xl md:text-5xl text-[#F7F2F6]">
            Nurturing Next-Generation Innovators
          </h2>
          <p className="mt-4 text-base text-[#F7F2F6]/70 leading-relaxed">
            Established in 2015, CIE supports entrepreneurship development, early-stage ventures, and the startup ecosystem at MLRIT. The Internship Drive is engineered to place emerging talent into high-impact environments.
          </p>
        </div>
      </Container>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-[#2A2A2A] bg-black py-24 text-[#F7F2F6]">
      <Container className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#33FF67]">
          30–31 OCTOBER 2026 · MLRIT HYDERABAD
        </p>
        <h2 className="display mt-6 max-w-4xl mx-auto text-5xl sm:text-7xl md:text-8xl text-[#F7F2F6]">
          Your next opportunity starts at Equinox.
        </h2>
        <div className="mt-10 flex justify-center">
          <CtaPair />
        </div>
      </Container>
    </section>
  );
}
