import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { pageMeta } from "@/lib/seo";
import { AuthLayout, NotOpenNotice, RoleTabs } from "@/components/site/AuthLayout";
import { FieldLabel } from "@/components/site/primitives";

export const Route = createFileRoute("/login")({
  head: () => pageMeta("Login", "Log in to your Equinox E-Summit 2K26 Internship Drive account."),
  component: Login,
});

function Login() {
  const [role, setRole] = useState<"student" | "company">("student");
  return (
    <AuthLayout title={<>Welcome<br />back.</>} aside="Pick up where you left off — your profile, saved roles and applications.">
      <h2 className="headline text-3xl">Log in</h2>
      <div className="mt-6"><RoleTabs value={role} onChange={setRole} /></div>
      <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
        <NotOpenNotice />
        <div><FieldLabel htmlFor="l-email">Email</FieldLabel><input id="l-email" type="email" autoComplete="email" className="field" disabled /></div>
        <div><FieldLabel htmlFor="l-pass">Password</FieldLabel><input id="l-pass" type="password" autoComplete="current-password" className="field" disabled /></div>
        <button className="btn btn-ink w-full" disabled>Log in</button>
        <p className="text-center text-sm text-muted-foreground">
          New here? <Link to="/register" className="text-foreground underline decoration-signal underline-offset-4">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
