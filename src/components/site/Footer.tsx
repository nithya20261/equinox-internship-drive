import { Link } from "@tanstack/react-router";
import { EVENT } from "@/data/site";
import { Container } from "./primitives";
import { Shield, Sparkles } from "lucide-react";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/internships", label: "Opportunities" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/register", label: "Registration" },
  { to: "/login", label: "Login" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-[#2A2A2A] bg-black text-[#F7F2F6]">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#7484FE]">
                THE
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-gradient-to-r from-[#7484FE] to-[#33FF67] px-2 py-0.5 font-mono text-[9px] font-bold text-black">
                <Sparkles className="h-2.5 w-2.5 fill-black" /> 2nd Edition
              </span>
            </div>

            <div className="mt-2 font-display font-black tracking-tight text-3xl sm:text-5xl text-[#F7F2F6]">
              EQUINOX
            </div>

            <div className="mt-1 font-display font-bold tracking-widest text-lg sm:text-2xl bg-gradient-to-r from-[#7484FE] to-[#33FF67] bg-clip-text text-transparent">
              E-SUMMIT 2K26 · INTERNSHIP DRIVE
            </div>

            <p className="font-mono text-xs text-[#F7F2F6]/60 mt-4">
              {EVENT.name} · {EVENT.dates} · MLRIT, {EVENT.city}
            </p>

            <div className="mt-6 flex items-center gap-2 font-mono text-[11px] text-[#33FF67] border border-[#2A2A2A] px-3 py-1.5 w-fit bg-[#0A0A0A]">
              <Shield className="h-3.5 w-3.5" />
              <span>Candidate-Shielded Company Confidentiality Protocol</span>
            </div>
          </div>

          <nav aria-label="Footer" className="md:col-span-5">
            <ul className="grid grid-cols-2 gap-x-6 border-t border-[#2A2A2A]">
              {LINKS.map((l) => (
                <li key={l.to} className="border-b border-[#2A2A2A]">
                  <Link
                    to={l.to}
                    className="block py-3 font-mono text-xs uppercase tracking-wider text-[#F7F2F6]/70 transition-colors hover:text-[#33FF67]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-[#2A2A2A] pt-6 font-mono text-xs text-[#F7F2F6]/50 md:flex-row">
          <p>Organised by the {EVENT.host}.</p>
          <p>© 2026 MLR Institute of Technology</p>
        </div>
      </Container>
    </footer>
  );
}
