import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { Container, PageHero, TbaBadge } from "@/components/site/primitives";

export const Route = createFileRoute("/schedule")({
  head: () => pageMeta("Schedule", "Schedule for Equinox E-Summit 2K26 and the Internship Drive, 30–31 October at MLRIT Hyderabad. Timings to be announced."),
  component: Schedule,
});

function Schedule() {
  return (
    <>
      <PageHero label="Schedule" title={<>30–31<br />October.</>}>
        Two days at MLRIT, Hyderabad. Session timings will be announced soon.
      </PageHero>
      <Container className="grid gap-px border-x border-border bg-border py-0 md:grid-cols-2">
        {["Day 01 · 30 October", "Day 02 · 31 October"].map((d) => (
          <section key={d} className="bg-background p-8 md:p-12">
            <h2 className="display text-5xl md:text-6xl">{d.split(" · ")[0]}</h2>
            <p className="eyebrow mt-3 text-signal">{d.split(" · ")[1]}</p>
            <ul className="mt-10 border-t border-foreground">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex items-center justify-between gap-4 border-b border-border py-5">
                  <span className="eyebrow w-20 text-muted-foreground">--:--</span>
                  <span className="flex-1 text-muted-foreground">Session</span>
                  <TbaBadge>TBA</TbaBadge>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Container>
      <div className="h-20" />
    </>
  );
}
