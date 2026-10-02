import type { ReactNode } from "react";
import { EVENT } from "@/data/site";
import { Container } from "./primitives";

export function AuthLayout({ title, aside, children }: { title: ReactNode; aside: ReactNode; children: ReactNode }) {
  return (
    <Container className="grid min-h-[80vh] gap-0 py-12 lg:grid-cols-2">
      <div className="grid-lines flex flex-col justify-between bg-ink p-8 text-ink-foreground md:p-12">
        <p className="eyebrow text-signal">{EVENT.name}</p>
        <div className="my-16">
          <h1 className="display text-6xl md:text-8xl">{title}</h1>
          <div className="mt-6 max-w-sm text-ink-muted">{aside}</div>
        </div>
        <p className="eyebrow text-ink-muted">{EVENT.dates} · MLRIT {EVENT.city}</p>
      </div>
      <div className="border border-foreground bg-card p-8 md:p-12">{children}</div>
    </Container>
  );
}

export function RoleTabs({ value, onChange }: { value: "student" | "company"; onChange: (v: "student" | "company") => void }) {
  return (
    <div role="tablist" aria-label="Account type" className="grid grid-cols-2 border border-foreground">
      {(["student", "company"] as const).map((r) => (
        <button
          key={r}
          role="tab"
          type="button"
          aria-selected={value === r}
          onClick={() => onChange(r)}
          className="eyebrow h-11 transition-colors aria-selected:bg-foreground aria-selected:text-background"
        >
          {r === "student" ? "Student" : "Company / Startup"}
        </button>
      ))}
    </div>
  );
}

export function NotOpenNotice() {
  return (
    <div className="flex gap-3 border-l-2 border-signal bg-paper-deep p-4 text-sm" role="status">
      <span className="pulse-dot mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" aria-hidden />
      <p>Registration hasn't opened yet. Details will be announced soon — this form will activate then.</p>
    </div>
  );
}
