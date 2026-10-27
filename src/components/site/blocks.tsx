import { Link } from "@tanstack/react-router";
import { ArrowRight, Shield, Lock } from "lucide-react";
import { INTERNSHIP_FIELDS, JOURNEY } from "@/data/site";
import { Reveal, TbaBadge } from "./primitives";

export function Journey() {
  return (
    <ol className="grid border-l border-t border-[#2A2A2A] md:grid-cols-5 bg-black">
      {JOURNEY.map((j, i) => (
        <li
          key={j.step}
          className="group relative border-b border-r border-[#2A2A2A] p-6 transition-all hover:bg-[#0A0A0A] hover:border-[#7484FE] md:min-h-72"
        >
          <Reveal delay={i * 0.06}>
            <span className="display text-6xl md:text-7xl bg-gradient-to-br from-[#7484FE] to-[#33FF67] bg-clip-text text-transparent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="headline mt-8 text-xl md:text-2xl uppercase text-[#F7F2F6]">
              {j.step}
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-[#F7F2F6]/60 leading-relaxed">
              {j.note}
            </p>
          </Reveal>
          {i < JOURNEY.length - 1 && (
            <ArrowRight
              className="absolute right-4 top-6 hidden text-[#2A2A2A] group-hover:text-[#33FF67] transition-colors md:block"
              size={18}
              aria-hidden
            />
          )}
        </li>
      ))}
    </ol>
  );
}

/** Structural preview of an internship listing with anonymous company shield. */
export function OpportunitySlot({ n }: { n: number }) {
  const roles = [
    { title: "AI Systems & Infrastructure Intern", domain: "Artificial Intelligence", mode: "On-Campus" },
    { title: "Full-Stack Web3 / Cloud Intern", domain: "Cloud & Distributed Systems", mode: "On-Campus" },
    { title: "Embedded & Edge Computing Intern", domain: "IoT & Hardware", mode: "On-Campus" },
  ];
  const defaultRole = { title: "AI Systems & Infrastructure Intern", domain: "Artificial Intelligence", mode: "On-Campus" };
  const role = roles[(n - 1) % roles.length] ?? defaultRole;

  return (
    <article className="group grid gap-4 border-b border-[#2A2A2A] py-6 transition-colors hover:bg-[#0A0A0A] md:grid-cols-12 md:items-center md:px-4">
      <div className="flex items-center gap-4 md:col-span-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#2A2A2A] bg-black text-[#7484FE] font-mono text-xs font-bold">
          {String(n).padStart(2, "0")}
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#7484FE]">
            <Shield className="h-3 w-3" />
            <span className="uppercase tracking-wider">Company Identity Shielded</span>
          </div>
          <h3 className="headline mt-1 text-xl sm:text-2xl text-[#F7F2F6]">
            {role.title}
          </h3>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-xs md:col-span-5">
        <div>
          <dt className="eyebrow text-[0.6rem] text-[#F7F2F6]/50">Domain</dt>
          <dd className="mt-0.5 text-[#F7F2F6] font-mono text-xs">{role.domain}</dd>
        </div>
        <div>
          <dt className="eyebrow text-[0.6rem] text-[#F7F2F6]/50">Location</dt>
          <dd className="mt-0.5 text-[#F7F2F6] font-mono text-xs">MLRIT</dd>
        </div>
        <div>
          <dt className="eyebrow text-[0.6rem] text-[#F7F2F6]/50">Mode</dt>
          <dd className="mt-0.5 text-[#33FF67] font-mono text-xs">{role.mode}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3 md:col-span-2 md:justify-end">
        <span className="inline-flex items-center gap-1 border border-[#2A2A2A] bg-black px-2.5 py-1 font-mono text-[10px] text-[#7484FE]">
          <Lock className="h-2.5 w-2.5" /> Confidential
        </span>
      </div>
    </article>
  );
}

export function ListingAnatomy() {
  return (
    <div className="flex flex-wrap gap-2">
      {[...INTERNSHIP_FIELDS, "Apply"].map((f) => (
        <span
          key={f}
          className="font-mono text-[10px] tracking-wider uppercase border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-1.5 text-[#F7F2F6]/80"
        >
          {f}
        </span>
      ))}
    </div>
  );
}

export function CtaPair({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link to="/internships" className="btn btn-signal">
        Explore Opportunities <ArrowRight size={16} />
      </Link>
      <Link
        to="/register"
        className={`btn ${inverse ? "btn-line-inverse" : "btn-line"}`}
      >
        Register as Student
      </Link>
    </div>
  );
}
