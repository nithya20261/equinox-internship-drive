import type { ReactNode } from "react";
import { EVENT } from "@/data/site";
import { Container } from "./primitives";
import { WireframeGlobe } from "./WireframeGlobe";

export function AuthLayout({
  title,
  aside,
  children,
}: {
  title: ReactNode;
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container className="grid min-h-[80vh] gap-0 py-12 lg:grid-cols-2">
      <div className="flex flex-col justify-between border border-[#2A2A2A] bg-black p-8 text-[#F7F2F6] md:p-12 relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-30 pointer-events-none">
          <WireframeGlobe size={180} strokeColor="#F7F2F6" accentColor="#33FF67" speed={0.005} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="pulse-dot h-2 w-2 rounded-full bg-[#33FF67]" />
            <p className="font-mono text-xs font-bold tracking-widest text-[#7484FE] uppercase">
              {EVENT.name}
            </p>
          </div>
          <div className="mt-14">
            <h1 className="font-display font-black text-5xl md:text-7xl leading-none text-[#F7F2F6]">
              {title}
            </h1>
            <div className="mt-6 max-w-sm font-sans text-sm text-[#F7F2F6]/70 leading-relaxed">
              {aside}
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-10 font-mono text-xs text-[#F7F2F6]/50">
          {EVENT.dates} · MLRIT {EVENT.city}
        </div>
      </div>

      <div className="border-t lg:border-t-0 lg:border-l border-b border-r border-[#2A2A2A] bg-[#0A0A0A] p-8 md:p-12 text-[#F7F2F6]">
        {children}
      </div>
    </Container>
  );
}

export function RoleTabs({
  value,
  onChange,
}: {
  value: "student" | "admin";
  onChange: (v: "student" | "admin") => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Account type"
      className="grid grid-cols-2 border border-[#2A2A2A] bg-black"
    >
      {(["student", "admin"] as const).map((r) => (
        <button
          key={r}
          role="tab"
          type="button"
          aria-selected={value === r}
          onClick={() => onChange(r)}
          className={`font-mono text-xs uppercase tracking-wider h-11 transition-all ${
            value === r
              ? "bg-[#7484FE] text-black font-bold shadow-[0_0_12px_rgba(116,132,254,0.3)]"
              : "text-[#F7F2F6]/60 hover:text-[#F7F2F6] hover:bg-[#2A2A2A]/40"
          }`}
        >
          {r === "student" ? "Student" : "Admin"}
        </button>
      ))}
    </div>
  );
}
