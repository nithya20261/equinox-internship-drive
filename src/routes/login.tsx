import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { pageMeta } from "@/lib/seo";
import { AuthLayout, RoleTabs } from "@/components/site/AuthLayout";
import { FieldLabel } from "@/components/site/primitives";
import { Loader2 } from "lucide-react";
import { loginStudent, loginCompany } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => pageMeta("Login", "Log in to your Equinox E-Summit 2K26 Internship Drive account."),
  component: Login,
});

function Login() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "company">("student");
  
  // Student login fields: Name, Team code, Password
  const [studentName, setStudentName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // Company login fields: Email, Password
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      setIsSubmitting(true);
      if (role === "student") {
        await loginStudent({
          teamCode: teamCode.trim(),
          name: studentName.trim(),
          password: studentPassword,
        });
        await router.invalidate();
        window.location.href = "/internships";
      } else {
        await loginCompany(companyEmail.trim(), companyPassword);
        await router.invalidate();
        window.location.href = "/dashboard/company";
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={<>Welcome<br />back.</>}
      aside="Pick up where you left off — access your profile, track applications and view results."
    >
      <h2 className="headline text-3xl">Log in</h2>
      <div className="mt-6">
        <RoleTabs
          value={role}
          onChange={(newRole) => {
            setRole(newRole);
            setErrorMessage(null);
          }}
        />
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleLogin}>
        {errorMessage && (
          <div
            className="flex items-center gap-2 border-l-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <span>{errorMessage}</span>
          </div>
        )}

        {role === "student" ? (
          <>
            <div>
              <FieldLabel htmlFor="l-student-name">Full name</FieldLabel>
              <input
                id="l-student-name"
                type="text"
                autoComplete="name"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="field"
                placeholder="e.g. Aditi Rao"
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="l-team-code" hint="Or registered email">Team code</FieldLabel>
              <input
                id="l-team-code"
                type="text"
                value={teamCode}
                onChange={(e) => {
                  setTeamCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="field uppercase"
                placeholder="e.g. EQX-402"
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="l-student-pass">Password</FieldLabel>
              <input
                id="l-student-pass"
                type="password"
                autoComplete="current-password"
                value={studentPassword}
                onChange={(e) => {
                  setStudentPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="field"
                placeholder="••••••••"
                required
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <FieldLabel htmlFor="l-company-email">Work email</FieldLabel>
              <input
                id="l-company-email"
                type="email"
                autoComplete="email"
                value={companyEmail}
                onChange={(e) => {
                  setCompanyEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="field"
                placeholder="talent@acme.com"
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="l-company-pass">Password</FieldLabel>
              <input
                id="l-company-pass"
                type="password"
                autoComplete="current-password"
                value={companyPassword}
                onChange={(e) => {
                  setCompanyPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="field"
                placeholder="••••••••"
                required
              />
            </div>
          </>
        )}

        <button type="submit" disabled={isSubmitting} className="btn btn-ink w-full disabled:opacity-50">
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging in...
            </span>
          ) : (
            "Log in"
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            to="/register"
            className="text-foreground underline decoration-signal underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
