import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-4 sm:px-6 md:px-8", className)}>{children}</div>;
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ index, children, className }: { index?: string | undefined; children: ReactNode; className?: string | undefined }) {
  return (
    <p className={cn("eyebrow flex items-center gap-2.5 text-[#7484FE]", className)}>
      {index && <span className="font-bold text-[#33FF67]">{index}</span>}
      <span className="h-px w-6 bg-white/20" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function SectionHead({ index, label, title, children }: { index?: string; label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="grid gap-6 border-t border-white/20 pt-8 md:grid-cols-12">
      <div className="md:col-span-3">
        <Eyebrow index={index}>{label}</Eyebrow>
      </div>
      <div className="md:col-span-9">
        <Reveal>
          <h2 className="font-display-title text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-[#F7F2F6] break-words">{title}</h2>
        </Reveal>
        {children && <div className="lede mt-4 max-w-2xl text-white/75">{children}</div>}
      </div>
    </div>
  );
}

export function PageHero({ label, title, children }: { label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/20 pb-12 pt-10 sm:pb-16 sm:pt-14">
      <Container>
        <div className="inline-block border border-white/20 bg-[#151515] px-3.5 py-1 font-mono text-xs font-black uppercase tracking-widest text-[#7484FE] shadow-[2px_2px_0px_#2A2A2A]">
          {label}
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-display-title mt-4 max-w-5xl text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#F7F2F6] break-words"
        >
          {title}
        </motion.h1>
        {children && <div className="mt-4 max-w-2xl text-base sm:text-lg text-white/80 leading-relaxed font-sans">{children}</div>}
      </Container>
    </section>
  );
}

export function TbaBadge({ children = "To Be Announced" }: { children?: ReactNode }) {
  return (
    <span className="font-mono inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#151515] px-3 py-1 text-xs font-bold text-[#F7F2F6] shadow-[2px_2px_0px_#2A2A2A]">
      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#33FF67]" aria-hidden />
      {children}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-white/20 bg-[#2A2A2A]/90 p-8 text-center shadow-[6px_6px_0px_rgba(0,0,0,0.35)] backdrop-blur-xs md:p-14">
      <div className="mx-auto max-w-lg">
        <TbaBadge>Coming Soon</TbaBadge>
        <h3 className="font-display-title mt-5 text-2xl sm:text-3xl font-black uppercase text-[#F7F2F6]">{title}</h3>
        <p className="mt-3 text-sm text-white/70 leading-relaxed font-sans">{body}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-white/20 rounded-2xl border-2 border-white/20 bg-[#2A2A2A]/90 shadow-[4px_4px_0px_rgba(0,0,0,0.35)]" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 p-5">
          <div className="h-10 w-10 rounded-xl bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between font-sans text-sm font-semibold text-white/90 tracking-normal">
      <span>{children}</span>
      {hint && <span className="text-xs text-white/60 font-normal">{hint}</span>}
    </label>
  );
}
