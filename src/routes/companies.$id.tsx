import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Container, EmptyState, TbaBadge } from "@/components/site/primitives";

export const Route = createFileRoute("/companies/$id")({
  head: () => ({
    meta: [
      { title: "Company profile — Internship Drive · Equinox 2K26" },
      { name: "description", content: "Company profile and open internships at the Equinox E-Summit 2K26 Internship Drive." },
      { property: "og:title", content: "Company profile — Equinox 2K26" },
      { property: "og:description", content: "Company profile and open internships at the Equinox E-Summit 2K26 Internship Drive." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompanyDetail,
});

function CompanyDetail() {
  return (
    <Container className="py-12 md:py-16">
      <Link to="/companies" className="eyebrow inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> All companies
      </Link>
      <div className="mt-10 flex flex-col gap-8 border-b border-foreground pb-10 md:flex-row md:items-end">
        <div className="hatch h-28 w-28 shrink-0 border border-foreground" role="img" aria-label="Company logo placeholder" />
        <div>
          <TbaBadge />
          <h1 className="display mt-4 text-6xl md:text-8xl">Company name</h1>
        </div>
      </div>
      <dl className="grid border-b border-border sm:grid-cols-4">
        {["Industry", "Type", "Website", "Open roles"].map((k) => (
          <div key={k} className="border-b border-border py-5 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0">
            <dt className="eyebrow text-muted-foreground">{k}</dt>
            <dd className="mt-1">TBA</dd>
          </div>
        ))}
      </dl>
      <div className="mt-12">
        <EmptyState title="No internships posted yet." body="This company's roles will appear here once published." />
      </div>
    </Container>
  );
}
