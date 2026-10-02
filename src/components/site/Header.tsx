import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV } from "@/data/site";
import { Container } from "./primitives";

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="Internship Drive — Equinox E-Summit 2K26 home">
      <span className="relative flex h-8 w-8 overflow-hidden border border-foreground" aria-hidden>
        <span className="h-full w-1/2 bg-foreground" />
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal transition-transform duration-300 group-hover:scale-125" />
      </span>
      <span className="leading-none">
        <span className="headline block text-[1.05rem] uppercase">Internship Drive</span>
        <span className="eyebrow block text-[0.6rem] text-muted-foreground">Equinox E-Summit 2K26</span>
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="relative px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground data-[status=active]:after:absolute data-[status=active]:after:inset-x-3 data-[status=active]:after:-bottom-[13px] data-[status=active]:after:h-0.5 data-[status=active]:after:bg-signal"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login" className="btn h-10 px-4 hover:text-signal">Login</Link>
          <Link to="/register" className="btn btn-ink h-10 px-4">Register</Link>
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center border border-foreground lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </Container>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-border bg-background lg:hidden">
          <Container className="py-4">
            <ul className="divide-y divide-border">
              {NAV.map((n, i) => (
                <li key={n.to}>
                  <Link to={n.to} onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-3">
                    <span className="eyebrow text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="headline text-2xl uppercase">{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="btn btn-line">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn btn-ink">Register</Link>
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}
