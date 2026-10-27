import { useState } from "react";
import { Container, EmptyState } from "@/components/site/primitives";

export type DashSection = {
  key: string;
  label: string;
  empty: string;
  content?: React.ReactNode;
};

/** Shared shell for student / company / admin dashboards. Sections render real content or empty states. */
export function DashboardShell({
  role,
  subtitle,
  sections,
}: {
  role: string;
  subtitle?: string;
  sections: DashSection[];
}) {
  const [active, setActive] = useState(sections[0]?.key ?? "");
  const current = sections.find((s) => s.key === active) ?? sections[0];
  if (!current) return null;

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground pb-6">
        <div>
          <p className="eyebrow text-signal">
            {role} workspace {subtitle ? `· ${subtitle}` : ""}
          </p>
          <h1 className="display mt-3 text-5xl md:text-7xl">Dashboard</h1>
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          Equinox E-Summit 2K26 candidate portal. Real-time application and profile status.
        </p>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <nav aria-label={`${role} sections`} className="lg:col-span-3">
          <ul className="flex gap-1 overflow-x-auto bg-ink p-2 text-ink-foreground lg:flex-col">
            {sections.map((s) => (
              <li key={s.key}>
                <button
                  onClick={() => setActive(s.key)}
                  aria-current={active === s.key ? "page" : undefined}
                  className="w-full whitespace-nowrap px-4 py-3 text-left text-sm text-ink-muted transition-colors hover:text-ink-foreground aria-[current=page]:bg-signal aria-[current=page]:text-signal-foreground"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section className="lg:col-span-9" aria-live="polite">
          <h2 className="headline mb-6 text-3xl">{current.label}</h2>
          {current.content ? (
            current.content
          ) : (
            <EmptyState title={`No ${current.label.toLowerCase()} yet.`} body={current.empty} />
          )}
        </section>
      </div>
    </Container>
  );
}
