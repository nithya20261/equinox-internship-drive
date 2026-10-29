import { Link } from "@tanstack/react-router";
import { EVENT } from "@/data/site";
import { Container } from "./primitives";
import { Shield } from "lucide-react";

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
    <footer className="border-t border-[#2A2A2A] bg-[#151515] text-[#F7F2F6] brochure-grid-dense">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <Link to="/" className="inline-block transition-opacity hover:opacity-90">
              <img
                src="/equinox-logo.svg"
                alt="The Equinox 2.0 E-Summit 2K26"
                width="200"
                height="84"
                className="h-11 sm:h-12 w-auto object-contain"
              />
            </Link>

            <div className="mt-3 flex items-center gap-2">
              <span className="rounded bg-[#7484FE]/20 border border-[#7484FE]/40 px-2.5 py-0.5 font-mono text-xs font-bold text-[#7484FE] uppercase tracking-wider">
                Official Sub-Event · Page 06
              </span>
              <span className="font-mono text-xs text-[#33FF67] uppercase font-bold tracking-wider">
                Internship Drive
              </span>
            </div>

            <p className="font-sans text-sm text-[#F7F2F6]/70 mt-4 leading-relaxed max-w-md">
              {EVENT.name} · {EVENT.dates} · MLRIT, {EVENT.city}. Connecting students with high-growth startups and tech companies.
            </p>

            <div className="mt-6 flex items-center gap-2.5 font-sans text-xs text-[#33FF67] border border-white/10 px-3.5 py-2 w-fit bg-[#2A2A2A]/80 rounded-lg">
              <Shield className="h-4 w-4 shrink-0 text-[#33FF67]" />
              <span>Candidate-Shielded Company Confidentiality Protocol</span>
            </div>
          </div>

          <nav aria-label="Footer" className="md:col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-[#7484FE] font-bold mb-4">
              Quick Navigation
            </p>
            <ul className="grid grid-cols-2 gap-x-6 border-t border-white/10">
              {LINKS.map((l) => (
                <li key={l.to} className="border-b border-white/10">
                  <Link
                    to={l.to}
                    className="block py-3 font-sans text-sm text-[#F7F2F6]/75 transition-colors hover:text-[#33FF67]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 font-sans text-sm text-[#F7F2F6]/50 md:flex-row items-center">
          <p>Organised by {EVENT.host} · MLRIT Hyderabad.</p>
          <p>© 2026 Centre for Innovation & Entrepreneurship. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
