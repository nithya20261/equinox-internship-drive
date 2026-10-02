import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { FAQS, INTERNSHIP_FIELDS, JOURNEY } from "@/data/site";
import { Reveal, TbaBadge } from "./primitives";

export function Journey() {
  return (
    <ol className="grid border-l border-t border-foreground md:grid-cols-5">
      {JOURNEY.map((j, i) => (
        <li key={j.step} className="group relative border-b border-r border-foreground p-6 transition-colors hover:bg-ink hover:text-ink-foreground md:min-h-72">
          <Reveal delay={i * 0.06}>
            <span className="display text-7xl text-signal">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="headline mt-10 text-2xl uppercase">{j.step}</h3>
            <p className="mt-3 text-sm text-muted-foreground group-hover:text-ink-muted">{j.note}</p>
          </Reveal>
          {i < JOURNEY.length - 1 && (
            <ArrowRight className="absolute right-4 top-6 hidden text-muted-foreground md:block" size={18} aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ limit }: { limit?: number }) {
  const items = limit ? FAQS.slice(0, limit) : FAQS;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border-t border-foreground">
      {items.map((f, i) => {
        const isOpen = open === i;
        const pending = f.a.startsWith("Details will") || f.a.includes("announced soon");
        return (
          <div key={f.q} className="border-b border-border">
            <h3>
              <button
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-6 py-6 text-left"
              >
                <span className="eyebrow w-8 text-signal">{String(i + 1).padStart(2, "0")}</span>
                <span className="headline flex-1 text-xl md:text-2xl">{f.q}</span>
                <Plus className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} size={20} aria-hidden />
              </button>
            </h3>
            <div
              id={`faq-a-${i}`}
              role="region"
              aria-labelledby={`faq-q-${i}`}
              hidden={!isOpen}
              className="pb-6 pl-14 pr-10"
            >
              <p className="max-w-2xl text-muted-foreground">{f.a}</p>
              {pending && <div className="mt-3"><TbaBadge /></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Structural preview of an internship listing. Renders TBA values until real data exists. */
export function OpportunitySlot({ n }: { n: number }) {
  return (
    <article className="group grid gap-4 border-b border-border py-6 transition-colors hover:bg-card md:grid-cols-12 md:items-center md:px-4">
      <div className="flex items-center gap-4 md:col-span-4">
        <div className="hatch flex h-14 w-14 shrink-0 items-center justify-center border border-border">
          <span className="eyebrow text-muted-foreground">{String(n).padStart(2, "0")}</span>
        </div>
        <div>
          <p className="eyebrow text-muted-foreground">Company · TBA</p>
          <h3 className="headline mt-1 text-2xl">Internship role</h3>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-4 text-sm md:col-span-6">
        {["Domain", "Location", "Type"].map((k) => (
          <div key={k}>
            <dt className="eyebrow text-[0.62rem] text-muted-foreground">{k}</dt>
            <dd className="mt-1">—</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between gap-3 md:col-span-2 md:justify-end">
        <TbaBadge>Coming Soon</TbaBadge>
      </div>
    </article>
  );
}

export function ListingAnatomy() {
  return (
    <div className="flex flex-wrap gap-2">
      {[...INTERNSHIP_FIELDS, "Apply"].map((f) => (
        <span key={f} className="eyebrow border border-border px-3 py-1.5 text-[0.65rem]">{f}</span>
      ))}
    </div>
  );
}

export function CtaPair({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link to="/internships" className="btn btn-signal">
        Explore Opportunities <ArrowRight size={16} />
      </Link>
      <Link to="/register" className={`btn ${inverse ? "btn-line-inverse" : "btn-line"}`}>Register</Link>
    </div>
  );
}
