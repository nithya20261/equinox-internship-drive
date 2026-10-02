import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { EVENT } from "@/data/site";
import { Container, FieldLabel, PageHero, TbaBadge } from "@/components/site/primitives";

export const Route = createFileRoute("/contact")({
  head: () => pageMeta("Contact", "Contact the organisers of the Equinox E-Summit 2K26 Internship Drive at CIE, MLRIT Hyderabad."),
  component: Contact,
});

function Contact() {
  return (
    <>
      <PageHero label="Contact" title={<>Talk to<br />the team.</>} />
      <Container className="grid gap-12 py-16 md:grid-cols-12">
        <dl className="border-t border-foreground md:col-span-5">
          {[
            ["Organiser", EVENT.host],
            ["Venue", `${EVENT.venue}, ${EVENT.city}`],
            ["Dates", EVENT.datesLong],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-border py-5">
              <dt className="eyebrow text-muted-foreground">{k}</dt>
              <dd className="headline mt-1 text-xl">{v}</dd>
            </div>
          ))}
          <div className="border-b border-border py-5">
            <dt className="eyebrow text-muted-foreground">Email & phone</dt>
            <dd className="mt-2"><TbaBadge /></dd>
          </div>
        </dl>
        <form className="space-y-5 md:col-span-6 md:col-start-7" onSubmit={(e) => e.preventDefault()}>
          <div><FieldLabel htmlFor="c-name">Name</FieldLabel><input id="c-name" className="field" autoComplete="name" /></div>
          <div><FieldLabel htmlFor="c-email">Email</FieldLabel><input id="c-email" type="email" className="field" autoComplete="email" /></div>
          <div><FieldLabel htmlFor="c-msg">Message</FieldLabel><textarea id="c-msg" rows={5} className="field h-auto py-3" /></div>
          <button className="btn btn-ink" disabled aria-describedby="c-note">Send message</button>
          <p id="c-note" className="text-sm text-muted-foreground">The contact form will go live with registration.</p>
        </form>
      </Container>
    </>
  );
}
