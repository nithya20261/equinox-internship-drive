import { useEffect, useState, useCallback } from "react";

interface CinematicIntroProps {
  onComplete: () => void;
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const finishIntro = useCallback(() => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(onComplete, 450);
  }, [isFadingOut, onComplete]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const timer1 = setTimeout(() => setPhase(2), 350);
    const timer2 = setTimeout(() => setPhase(3), 900);
    const timer3 = setTimeout(() => {
      finishIntro();
    }, 2800);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [finishIntro]);

  return (
    <div
      onClick={finishIntro}
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#151515] text-[#F7F2F6] transition-opacity duration-500 ease-out select-none overflow-hidden cursor-pointer brochure-grid-dense ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="The Equinox 2.0 Internship Drive Intro"
    >
      {/* Background Starfield Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(116,132,254,0.18)_0%,_rgba(51,255,103,0.08)_45%,_transparent_75%)] pointer-events-none" />

      {/* Central Cinematic Stack */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl pointer-events-none">
        {/* Phase 1: Official Equinox Logo Reveal */}
        <div
          className={`flex flex-col items-center transition-all duration-500 transform ${
            phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <img
            src="/equinox-logo.svg"
            alt="The Equinox 2.0 E-Summit 2K26"
            width="380"
            height="160"
            className="w-64 sm:w-80 md:w-96 h-auto object-contain drop-shadow-[0_0_30px_rgba(116,132,254,0.3)]"
          />
        </div>

        {/* Phase 2: Tagline */}
        <div
          className={`mt-4 flex items-center gap-2 transition-all duration-500 transform ${
            phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#33FF67]">
            # WHERE PASSION MEETS PERSEVERANCE
          </span>
        </div>

        {/* Phase 3: Sub-Event 06 - INTERNSHIP DRIVE Reveal */}
        <div
          className={`mt-6 flex flex-col items-center transition-all duration-600 ${
            phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="mb-3 inline-block border border-white/20 bg-[#2A2A2A] px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#7484FE] shadow-[2px_2px_0px_#7484FE]">
            Official Sub-Event · Page 06
          </div>

          <h1 className="font-display-title text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight">
            <span className="mr-2 sm:mr-3 inline-block bg-[#F7F2F6] px-3.5 py-1 text-[#2A2A2A] shadow-[4px_4px_0px_#2A2A2A]">
              INTERNSHIP
            </span>
            <span className="text-[#F7F2F6]">DRIVE</span>
          </h1>

          <p className="mt-3 font-sans text-sm sm:text-base text-white/75">
            Centre for Innovation &amp; Entrepreneurship · MLRIT
          </p>
        </div>
      </div>
    </div>
  );
}

