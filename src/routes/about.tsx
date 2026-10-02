import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { EVENT } from "@/data/site";
import { Container, Eyebrow, PageHero, Reveal } from "@/components/site/primitives";
import { CtaPair } from "@/components/site/blocks";

export const Route = createFileRoute("/about")({
  head: () => pageMeta("About", "About Equinox E-Summit 2K26, the Internship Drive, and the Centre for Innovation & Entrepreneurship at MLRIT Hyderabad."),
  component: About,
});

function About() {
  const blocks = [
    { k: "Equinox E-Summit 2K26", v: "A 2-day E-Summit at MLR Institute of Technology, Hyderabad, on 30 & 31 October. Students explore entrepreneurship, startups, innovation, real-world challenges and industry opportunities." },
    { k: "The Internship Drive", v: "A major sub-event of the summit that connects students with startups and companies offering internships — to explore careers, gain practical experience, build connections and develop skills." },
    { k: "CIE @ MLRIT", v: "The Centre for Innovation & Entrepreneurship was established in 2015. It supports entrepreneurship development, early-stage startups and the innovation ecosystem at MLRIT." },
  ];
  return (
    <>
      <PageHero label="About" title={<>Where ideas<br />meet industry.</>}>
        {EVENT.stats[0].value} students and {EVENT.stats[1].value} startups expected. The previous edition drew {EVENT.previousEdition} participants.
      </PageHero>
      <Container className="py-20">
        {blocks.map((b, i) => (
          <Reveal key={b.k}>
            <div className="grid gap-6 border-t border-foreground py-12 md:grid-cols-12">
              <div className="md:col-span-4"><Eyebrow index={String(i + 1).padStart(2, "0")}>{b.k}</Eyebrow></div>
              <p className="headline text-2xl md:col-span-8 md:text-4xl">{b.v}</p>
            </div>
          </Reveal>
        ))}
        <div className="border-t border-foreground pt-12"><CtaPair /></div>
      </Container>
    </>
  );
}
