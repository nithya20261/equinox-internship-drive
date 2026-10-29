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
  aside?: ReactNode | undefined;
  children: ReactNode;
}) {
  return (
    <Container className="py-10 sm:py-14">
      <div className="grid min-h-[75vh] rounded-3xl border-2 border-white/20 overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs lg:grid-cols-2">
        <div className="flex flex-col justify-center brochure-grid-dense bg-[#151515] p-6 sm:p-8 md:p-12 text-[#F7F2F6] relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/20">
          <div className="relative z-10 max-w-full">
            <h1 className="font-display-title font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-normal text-[#F7F2F6] break-normal leading-tight">
              {title}
            </h1>
            {aside && (
              <div className="mt-4 max-w-sm font-sans text-sm text-white/70 leading-relaxed">
                {aside}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#2A2A2A]/95 p-8 md:p-12 text-[#F7F2F6]">
          {children}
        </div>
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
      className="grid grid-cols-2 p-1 rounded-full border border-white/20 bg-[#151515]"
    >
      {(["student", "admin"] as const).map((r) => (
        <button
          key={r}
          role="tab"
          type="button"
          aria-selected={value === r}
          onClick={() => onChange(r)}
          className={`font-sans text-sm font-semibold tracking-normal h-9 rounded-full transition-all ${
            value === r
              ? "bg-[#7484FE] text-[#151515] font-bold shadow-md"
              : "text-white/75 hover:text-white"
          }`}
        >
          {r === "student" ? "Student" : "Admin"}
        </button>
      ))}
    </div>
  );
}
