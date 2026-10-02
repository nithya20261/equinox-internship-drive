import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Organiser console — Internship Drive" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <DashboardShell
      role="Organiser"
      sections={[
        { key: "students", label: "Students", empty: "Registered students will be listed here." },
        { key: "companies", label: "Companies", empty: "Participating companies will be listed here." },
        { key: "internships", label: "Internships", empty: "Review and publish internship listings." },
        { key: "applications", label: "Applications", empty: "All applications across the drive." },
        { key: "schedule", label: "Event schedule", empty: "Add sessions for 30–31 October." },
        { key: "announcements", label: "Announcements", empty: "Publish updates to participants." },
        { key: "faqs", label: "FAQs", empty: "Manage public questions and answers." },
        { key: "analytics", label: "Analytics", empty: "Metrics appear once real activity begins." },
      ]}
    />
  ),
});
