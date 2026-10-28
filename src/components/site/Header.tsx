import { Link } from "@tanstack/react-router";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { NAV } from "@/data/site";
import { Container } from "./primitives";
import { useAuth } from "@/lib/auth";

export function Logo() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-3.5 transition-transform hover:opacity-95"
      aria-label="The Equinox E-Summit 2K26 Internship Drive home"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#7484FE]">
            THE
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full border border-[#2A2A2A] bg-gradient-to-r from-[#7484FE] to-[#33FF67] px-1.5 py-0.2 font-mono text-[8px] font-bold text-black">
            <Sparkles className="h-2 w-2 fill-black" /> 2nd Edition
          </span>
        </div>
        <div className="flex items-center font-display text-lg font-black tracking-tight text-[#F7F2F6]">
          EQUINOX
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[8px] tracking-wider text-[#F7F2F6]/60">
          <span className="bg-gradient-to-r from-[#7484FE] to-[#33FF67] bg-clip-text text-transparent font-bold">
            E-SUMMIT 2K26
          </span>
          <span>·</span>
          <span className="text-[#33FF67] font-semibold">INTERNSHIP DRIVE</span>
        </div>
      </div>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const dashboardLink = user?.role === "admin" ? "/dashboard/admin" : "/dashboard/student";

  return (
    <header className="sticky top-0 z-40 border-b border-[#2A2A2A] bg-black/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-2">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="relative px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-[#F7F2F6]/70 transition-colors hover:text-[#33FF67] data-[status=active]:text-[#33FF67] data-[status=active]:after:absolute data-[status=active]:after:inset-x-3 data-[status=active]:after:-bottom-[17px] data-[status=active]:after:h-0.5 data-[status=active]:after:bg-[#33FF67] data-[status=active]:after:shadow-[0_0_8px_#33FF67]"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isLoggedIn ? (
            <>
              <Link to={dashboardLink} className="btn h-9 px-4 text-xs hover:text-[#33FF67]">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
                className="btn btn-line h-9 px-4 text-xs"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-line h-9 px-4 text-xs hover:text-[#7484FE]">
                Login
              </Link>
              <Link to="/register" className="btn btn-signal h-9 px-4 text-xs">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center border border-[#2A2A2A] bg-black text-[#F7F2F6] hover:border-[#7484FE] transition-colors lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </Container>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-[#2A2A2A] bg-black lg:hidden">
          <Container className="py-5">
            <ul className="divide-y divide-[#2A2A2A]">
              {NAV.map((n, i) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 py-3.5 transition-colors hover:text-[#33FF67]"
                  >
                    <span className="eyebrow text-[#7484FE]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="headline text-2xl uppercase text-[#F7F2F6]">{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {isLoggedIn ? (
                <>
                  <Link to={dashboardLink} onClick={() => setOpen(false)} className="btn btn-line">
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setOpen(false);
                      window.location.href = "/";
                    }}
                    className="btn btn-signal"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn btn-line">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn btn-signal">
                    Register
                  </Link>
                </>
              )}
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}
