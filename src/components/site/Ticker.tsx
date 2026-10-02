export function Ticker() {
  const words = ["Explore", "Apply", "Connect", "Learn", "Grow", "30–31 Oct", "MLRIT Hyderabad", "Equinox 2K26"];
  return (
    <div className="overflow-hidden border-y border-foreground bg-ink py-3 text-ink-foreground" aria-hidden>
      <div className="marquee flex w-max gap-10 whitespace-nowrap">
        {Array.from({ length: 2 }).map((_, k) => (
          <div key={k} className="flex gap-10">
            {words.map((w) => (
              <span key={w} className="eyebrow flex items-center gap-10">
                {w} <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
