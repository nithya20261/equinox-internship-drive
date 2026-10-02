import { Link } from "@tanstack/react-router";
import { EVENT } from "@/data/site";
import { Container } from "./primitives";

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/internships", label: "Opportunities" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
  { to: "/register", label: "Registration" },
] as const;

export function Footer() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="display text-6xl md:text-8xl">
              Internship<br />Drive<span className="text-signal">.</span>
            </p>
            <p className="eyebrow mt-6 text-ink-muted">
              {EVENT.name} · {EVENT.dates} · MLRIT, {EVENT.city}
            </p>
          </div>
          <nav aria-label="Footer" className="md:col-span-5">
            <ul className="grid grid-cols-2 gap-x-6 border-t border-ink-border">
              {LINKS.map((l) => (
                <li key={l.to} className="border-b border-ink-border">
                  <Link to={l.to} className="block py-3 text-ink-muted transition-colors hover:text-signal">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-ink-border pt-6 text-sm text-ink-muted md:flex-row">
          <p>Organised by the {EVENT.host}.</p>
          <p className="eyebrow">© 2026 MLR Institute of Technology</p>
        </div>
      </Container>
    </footer>
  );
}
