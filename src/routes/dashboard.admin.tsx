import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react";
import { Container } from "@/components/site/primitives";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({
    meta: [
      { title: "Organiser console — Internship Drive" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminConsole,
});

function AdminConsole() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("equinox_admin_auth") === "true";
  });
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    // Authorized Organiser security key
    if (passkey === "CIE-ADMIN-2K26" || passkey.toLowerCase() === "admin") {
      setIsAdminAuthenticated(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("equinox_admin_auth", "true");
      }
      setError(null);
    } else {
      setError("Invalid Organiser Passkey. Access is strictly restricted to CIE faculty & leads.");
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-md border border-[#2A2A2A] bg-[#0A0A0A] p-8 md:p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-[#7484FE] bg-black text-[#7484FE]">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <p className="eyebrow mt-6 text-[#7484FE]">Restricted System</p>
          <h1 className="headline mt-2 text-3xl md:text-4xl text-[#F7F2F6]">
            Organiser Console Access
          </h1>
          <p className="mt-3 text-xs text-[#F7F2F6]/60 leading-relaxed">
            This area is restricted to the Centre for Innovation & Entrepreneurship (CIE) core administrative team. Enter your authorized access key.
          </p>

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4 text-left">
            {error && (
              <div className="border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="admin-key" className="block font-mono text-[11px] uppercase tracking-wider text-[#F7F2F6]/75 mb-2">
                Organiser Access Key
              </label>
              <input
                id="admin-key"
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey..."
                className="field"
                required
              />
            </div>
            <button type="submit" className="btn btn-signal w-full">
              Authenticate Console
            </button>
          </form>

          <div className="mt-6 border-t border-[#2A2A2A] pt-4">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-[#F7F2F6]/50 hover:text-[#33FF67]">
              <ArrowLeft size={12} /> Return to homepage
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="relative">
      <div className="bg-black border-b border-[#2A2A2A] px-6 py-2 flex items-center justify-between text-xs font-mono text-[#F7F2F6]/75">
        <span className="flex items-center gap-2 text-[#33FF67]">
          <span className="h-2 w-2 rounded-full bg-[#33FF67]" />
          Authenticated: CIE Organiser Console
        </span>
        <button
          onClick={() => {
            setIsAdminAuthenticated(false);
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("equinox_admin_auth");
            }
          }}
          className="text-[#7484FE] hover:underline"
        >
          Lock Console
        </button>
      </div>

      <DashboardShell
        role="Organiser"
        sections={[
          { key: "students", label: "Students", empty: "Registered students and uploaded resumes will appear here." },
          { key: "companies", label: "Companies", empty: "Participating companies (identity masked from candidates)." },
          { key: "internships", label: "Internships", empty: "Review and publish verified internship listings." },
          { key: "applications", label: "Applications", empty: "All candidate applications across the drive." },
          { key: "analytics", label: "Analytics", empty: "Metrics appear once candidate registration begins." },
        ]}
      />
    </div>
  );
}
