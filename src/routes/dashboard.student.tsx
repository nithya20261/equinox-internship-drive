import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/student")({
  head: () => ({ meta: [{ title: "Student dashboard — Internship Drive" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <DashboardShell
      role="Student"
      sections={[
        { key: "profile", label: "Profile", empty: "Complete your profile with education, skills and resume." },
        { key: "applications", label: "Applications", empty: "Roles you apply to and their status will appear here." },
        { key: "saved", label: "Saved opportunities", empty: "Bookmark roles to compare them later." },
        { key: "notifications", label: "Notifications", empty: "Updates from organisers and companies will show here." },
      ]}
    />
  ),
});
