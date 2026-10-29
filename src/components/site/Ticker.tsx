export function Ticker() {
  const words = [
    "THE EQUINOX 2.0",
    "EQUINOX INTERNSHIP DRIVE",
    "30 & 31 OCTOBER 2026",
    "MLRIT HYDERABAD",
    "# WHERE PASSION MEETS PERSEVERANCE",
    "CENTRE FOR INNOVATION & ENTREPRENEURSHIP",
    "2000+ STUDENTS",
    "15+ STARTUPS",
  ];

  return (
    <div
      className="overflow-hidden border-y border-white/20 bg-[#151515] py-3 text-[#F7F2F6]"
      aria-hidden
    >
      <div className="marquee flex w-max gap-12 whitespace-nowrap">
        {Array.from({ length: 2 }).map((_, k) => (
          <div key={k} className="flex gap-12">
            {words.map((w) => (
              <span
                key={w}
                className="font-mono text-xs uppercase tracking-widest flex items-center gap-12 text-[#F7F2F6]/80 font-bold"
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
