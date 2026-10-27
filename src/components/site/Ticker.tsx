export function Ticker() {
  const words = [
    "THE EQUINOX 2K26",
    "INTERNSHIP DRIVE",
    "2nd EDITION",
    "30–31 OCTOBER",
    "MLRIT HYDERABAD",
    "CONFIDENTIAL SCREENING",
    "2000+ STUDENTS",
    "15+ STARTUPS",
  ];

  return (
    <div
      className="overflow-hidden border-y border-[#2A2A2A] bg-black py-3 text-[#F7F2F6]"
      aria-hidden
    >
      <div className="marquee flex w-max gap-12 whitespace-nowrap">
        {Array.from({ length: 2 }).map((_, k) => (
          <div key={k} className="flex gap-12">
            {words.map((w) => (
              <span
                key={w}
                className="font-mono text-xs uppercase tracking-widest flex items-center gap-12 text-[#F7F2F6]/75"
              >
                {w} <span className="h-1.5 w-1.5 rounded-full bg-[#33FF67] shadow-[0_0_8px_#33FF67]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
