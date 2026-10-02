import { useState } from "react";
import { Container, EmptyState } from "@/components/site/primitives";

export type DashSection = { key: string; label: string; empty: string };

/** Shared shell for student / company / admin dashboards. Sections render empty states until wired to data. */
export function DashboardShell({ role, sections }: { role: string; sections: DashSection[] }) {
  const [active, setActive] = useState(sections[0].key);
  const current = sections.find((s) => s.key === active)!;
  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground pb-6">
        <div>
          <p className="eyebrow text-signal">{role} workspace · Preview</p>
          <h1 className="display mt-3 text-5xl md:text-7xl">Dashboard</h1>
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">Sign-in activates with registration. This preview shows the layout only.</p>
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
          <EmptyState title={`No ${current.label.toLowerCase()} yet.`} body={current.empty} />
        </section>
      </div>
    </Container>
  );
}
