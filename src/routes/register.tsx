import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { pageMeta } from "@/lib/seo";
import { AuthLayout, NotOpenNotice, RoleTabs } from "@/components/site/AuthLayout";
import { FieldLabel } from "@/components/site/primitives";

export const Route = createFileRoute("/register")({
  head: () => pageMeta("Register", "Register as a student or company for the Equinox E-Summit 2K26 Internship Drive. Registration opens soon."),
  component: Register,
});

function Register() {
  const [role, setRole] = useState<"student" | "company">("student");
  const fields =
    role === "student"
      ? [["Full name", "text", "name"], ["Email", "email", "email"], ["College", "text", "organization"], ["Password", "password", "new-password"]]
      : [["Company name", "text", "organization"], ["Contact person", "text", "name"], ["Work email", "email", "email"], ["Password", "password", "new-password"]];
  return (
    <AuthLayout title={<>Get<br />ready.</>} aside="Create one account to build your profile, apply to roles and track every application.">
      <h2 className="headline text-3xl">Create account</h2>
      <div className="mt-6"><RoleTabs value={role} onChange={setRole} /></div>
      <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
        <NotOpenNotice />
        {fields.map(([label = "", type, ac]) => {
          const id = `r-${label.toLowerCase().replace(/\s/g, "-")}`;
          return (
            <div key={id}>
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              <input id={id} type={type} autoComplete={ac} className="field" disabled />
            </div>
          );
        })}
        <button className="btn btn-signal w-full" disabled>Create account</button>
        <p className="text-center text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="text-foreground underline decoration-signal underline-offset-4">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
