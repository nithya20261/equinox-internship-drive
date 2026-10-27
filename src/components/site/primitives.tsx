import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-5 md:px-8", className)}>{children}</div>;
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ index, children, className }: { index?: string | undefined; children: ReactNode; className?: string | undefined }) {
  return (
    <p className={cn("eyebrow flex items-center gap-3 text-muted-foreground", className)}>
      {index && <span className="text-signal">{index}</span>}
      <span className="h-px w-8 bg-current opacity-40" aria-hidden />
      {children}
    </p>
  );
}

export function SectionHead({ index, label, title, children }: { index?: string; label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="grid gap-6 border-t border-foreground pt-6 md:grid-cols-12">
      <div className="md:col-span-3">
        <Eyebrow index={index}>{label}</Eyebrow>
      </div>
      <div className="md:col-span-9">
        <Reveal>
          <h2 className="headline text-4xl md:text-6xl">{title}</h2>
        </Reveal>
        {children && <div className="lede mt-5 max-w-2xl">{children}</div>}
      </div>
    </div>
  );
}

export function PageHero({ label, title, children }: { label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-b border-border">
      <Container className="pb-14 pt-16 md:pb-20 md:pt-24">
        <Eyebrow index="●">{label}</Eyebrow>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="display mt-6 max-w-5xl text-6xl md:text-8xl lg:text-[8.5rem]"
        >
          {title}
        </motion.h1>
        {children && <div className="lede mt-8 max-w-2xl">{children}</div>}
      </Container>
    </section>
  );
}

export function TbaBadge({ children = "To Be Announced" }: { children?: ReactNode }) {
  return (
    <span className="font-mono inline-flex items-center gap-2 border border-[#2A2A2A] bg-[#0A0A0A] px-2.5 py-1 text-[0.65rem] text-[#F7F2F6]/75">
      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#33FF67]" aria-hidden />
      {children}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="hatch relative border border-[#2A2A2A] bg-black px-6 py-16 text-center md:py-24">
      <div className="mx-auto max-w-lg bg-[#0A0A0A] border border-[#2A2A2A] px-6 py-8">
        <TbaBadge>Coming Soon</TbaBadge>
        <h3 className="headline mt-5 text-3xl md:text-4xl text-[#F7F2F6]">{title}</h3>
        <p className="mt-3 text-sm text-[#F7F2F6]/60 leading-relaxed">{body}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border border border-border" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 p-5">
          <div className="h-10 w-10 bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-muted" />
            <div className="h-3 w-1/2 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between">
      <span className="eyebrow text-foreground">{children}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
