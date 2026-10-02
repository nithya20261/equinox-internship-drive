import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/company")({
  head: () => ({ meta: [{ title: "Company dashboard — Internship Drive" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <DashboardShell
      role="Company"
      sections={[
        { key: "profile", label: "Company profile", empty: "Add your company details, logo and website." },
        { key: "internships", label: "Internships", empty: "Create and manage your internship listings." },
        { key: "applicants", label: "Applicants", empty: "Applications to your roles will appear here." },
      ]}
    />
  ),
});
