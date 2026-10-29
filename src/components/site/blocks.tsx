import { Link } from "@tanstack/react-router";
import { ArrowRight, Shield, Lock } from "lucide-react";
import { INTERNSHIP_FIELDS, JOURNEY } from "@/data/site";
import { Reveal } from "./primitives";
import type { Opportunity } from "@/lib/api";

export function Journey() {
  return (
    <ol className="grid gap-4 md:grid-cols-5">
      {JOURNEY.map((j, i) => (
        <li
          key={j.step}
          className="group relative rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs transition hover:border-[#7484FE]/80 flex flex-col justify-between"
        >
          <Reveal delay={i * 0.05}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#33FF67]">
                STEP 0{i + 1}
              </span>
              {i < JOURNEY.length - 1 && (
                <ArrowRight
                  className="hidden text-white/30 group-hover:text-[#33FF67] group-hover:translate-x-0.5 transition-all md:block"
                  size={16}
                  aria-hidden
                />
              )}
            </div>
            <h3 className="font-sans mt-4 text-base font-bold text-[#F7F2F6]">
              {j.step}
            </h3>
            <p className="mt-2 font-sans text-sm text-white/70 leading-relaxed">
              {j.note}
            </p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/** Structural preview or real internship listing with anonymous company shield. */
export function OpportunitySlot({
  n = 1,
  item,
  isLoggedIn = false,
  selectable = false,
  isSelected = false,
  onToggleSelect,
}: {
  n?: number;
  item?: Opportunity;
  isLoggedIn?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const roles = [
    { title: "AI Systems & Infrastructure Intern", domain: "Artificial Intelligence", mode: "On-Campus" },
    { title: "Full-Stack Web3 / Cloud Intern", domain: "Cloud & Distributed Systems", mode: "On-Campus" },
    { title: "Embedded & Edge Computing Intern", domain: "IoT & Hardware", mode: "On-Campus" },
  ];
  const defaultRole = roles[(n - 1) % roles.length] ?? roles[0]!;

  const title = item?.role || defaultRole.title;
  const domain = item?.domain || defaultRole.domain;
  const location = item?.location || "MLRIT";
  const mode = item?.mode || defaultRole.mode;
  const detailId = item?.id || "preview";

  return (
    <article
      className={`group rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs transition hover:border-[#7484FE]/80 ${
        isSelected ? "ring-2 ring-[#7484FE] bg-[#1E1E1E]" : ""
      }`}
    >
      <div className="grid gap-4 md:grid-cols-12 md:items-center">
        <div className="flex items-center gap-4 md:col-span-5">
          {selectable && item?.id ? (
            <label className="relative flex cursor-pointer items-center justify-center p-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect?.()}
                className="h-5 w-5 rounded border border-white/30 bg-[#151515] accent-[#33FF67] cursor-pointer"
                aria-label={`Select ${title}`}
              />
            </label>
          ) : null}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-[#151515] font-mono text-xs font-black text-[#7484FE] shadow-sm">
            {String(n).padStart(2, "0")}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#7484FE] uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              <span>Identity Shielded</span>
            </div>
            <h3 className="font-sans mt-1 text-base sm:text-lg font-bold text-[#F7F2F6]">
              {title}
            </h3>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-sm md:col-span-4 font-sans">
          <div>
            <dt className="text-xs text-white/50 font-medium">Domain</dt>
            <dd className="mt-0.5 text-white/90 truncate font-medium">{domain}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/50 font-medium">Location</dt>
            <dd className="mt-0.5 text-white/90 truncate font-medium">{location}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/50 font-medium">Mode</dt>
            <dd className="mt-0.5 text-[#33FF67] font-semibold">{mode}</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-[#151515] px-3 py-1 font-sans text-xs font-semibold text-[#7484FE]">
            <Lock className="h-3 w-3" /> Confidential
          </span>
          {isLoggedIn ? (
            <Link
              to="/internships/$id"
              params={{ id: detailId }}
              className="btn btn-signal h-9 px-4 text-sm font-semibold"
            >
              View Role <ArrowRight size={14} className="ml-1" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn btn-line h-9 px-4 text-sm font-semibold"
            >
              Login <Lock size={14} className="ml-1" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/** Card representation of an internship opportunity for 4-in-a-row grids */
export function OpportunityCard({
  n = 1,
  item,
  isLoggedIn = false,
  selectable = false,
  isSelected = false,
  onToggleSelect,
}: {
  n?: number;
  item?: Opportunity;
  isLoggedIn?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const roles = [
    { title: "AI Systems & Infrastructure Intern", domain: "Artificial Intelligence", mode: "On-Campus" },
    { title: "Full-Stack Web3 / Cloud Intern", domain: "Cloud & Distributed Systems", mode: "On-Campus" },
    { title: "Embedded & Edge Computing Intern", domain: "IoT & Hardware", mode: "On-Campus" },
    { title: "Cybersecurity & Risk Analyst Intern", domain: "Information Security", mode: "On-Campus" },
  ];
  const defaultRole = roles[(n - 1) % roles.length] ?? roles[0]!;

  const title = item?.role || defaultRole.title;
  const domain = item?.domain || defaultRole.domain;
  const location = item?.location || "MLRIT Campus";
  const mode = item?.mode || defaultRole.mode;
  const detailId = item?.id || "preview";

  const skills: string[] = Array.isArray(item?.skills)
    ? item.skills
    : typeof item?.skills === "string"
    ? item.skills.split(/[,•]/).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-2xl border-2 border-white/20 bg-[#1e1e1e] p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs transition hover:border-[#7484FE] hover:-translate-y-1 duration-200 ${
        isSelected ? "ring-2 ring-[#7484FE] bg-[#242424]" : ""
      }`}
    >
      <div>
        {/* Top Header: Badge, Shield & Multi-select */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-[#151515] font-mono text-xs font-black text-[#7484FE]">
              {String(n).padStart(2, "0")}
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#7484FE] uppercase">
              <Shield className="h-3 w-3 text-[#33FF67]" />
              <span>Shielded</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#151515] px-2 py-0.5 font-mono text-[10px] text-[#7484FE]">
              <Lock className="h-2.5 w-2.5" /> Confidential
            </span>
            {selectable && item?.id ? (
              <label
                className="relative flex cursor-pointer items-center justify-center p-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect?.()}
                  className="h-4 w-4 rounded border border-white/30 bg-[#151515] accent-[#33FF67] cursor-pointer"
                  aria-label={`Select ${title}`}
                />
              </label>
            ) : null}
          </div>
        </div>

        {/* Role Title */}
        <h3 className="font-sans mt-3 text-base font-bold text-[#F7F2F6] group-hover:text-[#33FF67] transition-colors line-clamp-2 min-h-[3rem]">
          {title}
        </h3>

        {/* Specs Badges: Domain, Mode, Location */}
        <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
          <span className="rounded border border-white/10 bg-[#151515] px-2 py-0.5 text-[#F7F2F6]/80 truncate max-w-full">
            {domain}
          </span>
          <span className="rounded border border-white/10 bg-[#151515] px-2 py-0.5 text-[#33FF67] font-semibold">
            {mode}
          </span>
          <span className="rounded border border-white/10 bg-[#151515] px-2 py-0.5 text-[#7484FE]">
            {location}
          </span>
        </div>

        {/* Skills Chips */}
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {skills.slice(0, 3).map((sk, idx) => (
              <span
                key={idx}
                className="rounded border border-white/10 bg-[#151515] px-1.5 py-0.5 font-mono text-[10px] text-[#F7F2F6]/70"
              >
                {sk}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="self-center font-mono text-[10px] text-[#F7F2F6]/40">
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Options to View the Role (Below) */}
      <div className="mt-5 pt-3 border-t border-white/10">
        <Link
          to="/internships/$id"
          params={{ id: detailId }}
          className="btn btn-signal w-full h-9 text-xs font-bold justify-center flex items-center gap-1.5 rounded-xl shadow-md"
        >
          View Role <ArrowRight size={13} />
        </Link>
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
          className="rounded-full border border-white/20 bg-[#151515] px-3.5 py-1.5 font-sans text-xs font-semibold text-white/90 shadow-[2px_2px_0px_#2A2A2A]"
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
      <Link to="/internships" className="btn btn-signal h-11 px-6 text-sm font-semibold">
        Explore Opportunities <ArrowRight size={16} />
      </Link>
      <Link
        to="/register"
        className={`btn h-11 px-6 text-sm font-semibold ${inverse ? "btn-line-inverse" : "btn-line"}`}
      >
        Register as Student
      </Link>
    </div>
  );
}
