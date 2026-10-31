import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { pageMeta } from "@/lib/seo";
import { AuthLayout, RoleTabs } from "@/components/site/AuthLayout";
import { FieldLabel } from "@/components/site/primitives";
import { Loader2 } from "lucide-react";
import { loginStudent, loginAdmin } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => pageMeta("Login", "Log in to your Equinox E-Summit 2K26 Internship Drive account."),
  // Admin tab is hidden from the public page; admins open /login?admin=1
  validateSearch: (search: Record<string, unknown>): { admin?: boolean } =>
    search["admin"] === undefined ? {} : { admin: String(search["admin"]) === "1" || search["admin"] === true },
  component: Login,
});

function Login() {
  const router = useRouter();
  const { admin: showAdmin } = Route.useSearch();
  const [role, setRole] = useState<"student" | "admin">("student");
  
  // Student login fields: Confirmation Number (CNF) & Password (same as CNF)
  const [cnfNumber, setCnfNumber] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // Admin login fields: Username (EQUINOXCIE), Password
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      setIsSubmitting(true);
      if (role === "student") {
        await loginStudent({
          cnfNumber: cnfNumber.trim(),
          password: studentPassword,
        });
        await router.invalidate();
        window.location.href = "/internships";
      } else {
        await loginAdmin({
          username: adminUsername.trim(),
          password: adminPassword,
        });
        await router.invalidate();
        window.location.href = "/dashboard/admin";
      }
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      if (
        msg.includes("Unexpected end of JSON input") ||
        msg.includes("JSON.parse") ||
        msg.includes("Unexpected token") ||
        msg.includes("Internal Server Error")
      ) {
        msg = "Authentication service temporarily unreachable. Please retry in a few moments.";
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome">
      <h2 className="headline text-3xl">Log in</h2>
      {showAdmin && (
        <div className="mt-6">
          <RoleTabs
            value={role}
            onChange={(newRole) => {
              setRole(newRole);
              setErrorMessage(null);
            }}
          />
        </div>
      )}

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
              <FieldLabel htmlFor="l-cnf-number" hint="CNF number, email, or team code">Confirmation Number / Email</FieldLabel>
              <input
                id="l-cnf-number"
                type="text"
                autoComplete="username"
                value={cnfNumber}
                onChange={(e) => {
                  setCnfNumber(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="field font-mono font-medium"
                placeholder="CNF-XXXXXX or your registered email"
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="l-student-pass" hint="Your registered password">Password</FieldLabel>
              <input
                id="l-student-pass"
                type="password"
                autoComplete="current-password"
                value={studentPassword}
                onChange={(e) => {
                  setStudentPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="field font-mono"
                placeholder="Enter password"
                required
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <FieldLabel htmlFor="l-admin-username">Admin username</FieldLabel>
              <input
                id="l-admin-username"
                type="text"
                autoComplete="username"
                value={adminUsername}
                onChange={(e) => {
                  setAdminUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="field uppercase"
                placeholder="EQUINOXCIE"
                required
              />
            </div>

            <div>
              <FieldLabel htmlFor="l-admin-pass">Password</FieldLabel>
              <input
                id="l-admin-pass"
                type="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
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
