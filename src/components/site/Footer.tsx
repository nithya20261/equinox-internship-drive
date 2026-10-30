import { Link } from "@tanstack/react-router";
import { Container } from "./primitives";

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
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 md:gap-12 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <Link to="/" className="inline-block transition-opacity hover:opacity-90">
              <img
                src="/equinox-logo.svg"
                alt="The Equinox 2.0 E-Summit 2K26"
                width="200"
                height="84"
                className="h-10 sm:h-12 w-auto max-w-[170px] sm:max-w-none object-contain"
              />
            </Link>
          </div>

          <nav aria-label="Footer" className="md:col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-[#7484FE] font-bold mb-4">
              Quick Navigation
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 border-t border-white/10">
              {LINKS.map((l) => (
                <li key={l.to} className="border-b border-white/10">
                  <Link
                    to={l.to}
                    className="flex min-h-[44px] items-center py-2 font-sans text-sm text-[#F7F2F6]/75 transition-colors hover:text-[#33FF67]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 sm:mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 font-sans text-xs sm:text-sm text-[#F7F2F6]/50 md:flex-row items-center text-center sm:text-left">
          <p>© 2026 Centre for Innovation &amp; Entrepreneurship. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
