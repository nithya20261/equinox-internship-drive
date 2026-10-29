import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV } from "@/data/site";
import { Container } from "./primitives";
import { useAuth } from "@/lib/auth";

export function Logo() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-3 transition-opacity hover:opacity-90 shrink-0"
      aria-label="The Equinox E-Summit 2K26 Internship Drive home"
    >
      <img
        src="/equinox-logo.svg"
        alt="The Equinox 2.0 E-Summit 2K26"
        width="138"
        height="58"
        className="h-8 sm:h-9 w-auto object-contain"
      />
      <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/20">
        <span className="rounded bg-[#7484FE]/20 border border-[#7484FE]/40 px-2 py-0.5 font-mono text-[11px] font-bold text-[#7484FE] uppercase tracking-wider">
          Internship Drive
        </span>
      </div>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const dashboardLink = user?.role === "admin" ? "/dashboard/admin" : "/dashboard/student";

  return (
    <header className="sticky top-0 z-40 border-b border-[#2A2A2A] bg-[#151515]/95 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Primary" className="hidden lg:flex items-center">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="relative px-3.5 py-2 font-sans text-sm font-medium tracking-normal text-[#F7F2F6]/75 transition-colors hover:text-[#33FF67] data-[status=active]:text-[#33FF67] data-[status=active]:after:absolute data-[status=active]:after:inset-x-3 data-[status=active]:after:-bottom-[20px] data-[status=active]:after:h-0.5 data-[status=active]:after:bg-[#33FF67] data-[status=active]:after:shadow-[0_0_8px_#33FF67]"
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
              <Link to={dashboardLink} className="btn h-9 px-4 text-sm font-semibold hover:text-[#33FF67]">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
                className="btn btn-line h-9 px-4 text-sm font-semibold"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-line h-9 px-4 text-sm font-semibold hover:text-[#7484FE]">
                Login
              </Link>
              <Link to="/register" className="btn btn-line h-9 px-4 text-sm font-semibold hover:text-[#7484FE]">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center border border-[#2A2A2A] bg-[#151515] text-[#F7F2F6] hover:border-[#7484FE] transition-colors lg:hidden rounded-lg"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-[#2A2A2A] bg-[#151515] lg:hidden">
          <Container className="py-5">
            <ul className="divide-y divide-[#2A2A2A]">
              {NAV.map((n, i) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-3.5 transition-colors hover:text-[#33FF67]"
                  >
                    <span className="font-sans text-lg font-medium text-[#F7F2F6]">{n.label}</span>
                    <span className="font-mono text-xs text-[#7484FE]">0{i + 1}</span>
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
                    className="btn btn-line"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn btn-line">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn btn-line">
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
