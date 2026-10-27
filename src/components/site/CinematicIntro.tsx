import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface CinematicIntroProps {
  onComplete: () => void;
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Cinematic timing: punchy, sleek, and automated
    const timer1 = setTimeout(() => setPhase(2), 350);
    const timer2 = setTimeout(() => setPhase(3), 1050);
    const timer3 = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onComplete, 600);
    }, 2800);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        triggerFinish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onComplete]);

  const triggerFinish = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(onComplete, 500);
  };

  return (
    <div
      onClick={triggerFinish}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-[#F7F2F6] transition-opacity duration-600 select-none overflow-hidden cursor-pointer ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Equinox E-Summit 2K26 Intro"
    >
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A2A2A18_1px,transparent_1px),linear-gradient(to_bottom,#2A2A2A18_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Radial energy glow behind center */}
      <div className="absolute h-96 w-96 rounded-full bg-gradient-to-tr from-[#7484FE]/20 via-[#33FF67]/15 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar with Skip */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerFinish();
          }}
          className="group flex items-center gap-2 border border-[#2A2A2A] bg-black/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#F7F2F6]/70 transition-all hover:border-[#7484FE] hover:text-[#33FF67]"
        >
          <span>Skip</span>
          <span className="text-[10px] text-[#7484FE] group-hover:translate-x-0.5 transition-transform">[ESC]</span>
        </button>
      </div>

      {/* Central Cinematic Stack */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl pointer-events-none">
        {/* Phase 1: Tag & Edition badge */}
        <div
          className={`flex items-center gap-3 transition-all duration-600 transform ${
            phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <span className="font-mono text-xs md:text-sm font-semibold tracking-[0.25em] text-[#7484FE] uppercase">
            THE
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-gradient-to-r from-[#7484FE] to-[#33FF67] px-3 py-0.5 font-mono text-[11px] font-bold tracking-wider text-black">
            <Sparkles className="h-3 w-3 fill-black" /> 2nd Edition
          </span>
        </div>

        {/* Phase 2: Massive EQUINOX */}
        <div
          className={`mt-4 font-display font-black tracking-tighter text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] text-[#F7F2F6] transition-all duration-700 transform ${
            phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          EQUINOX
        </div>

        {/* E-SUMMIT 2K26 gradient title */}
        <div
          className={`mt-2 font-display font-extrabold tracking-widest text-2xl sm:text-4xl md:text-5xl uppercase bg-gradient-to-r from-[#7484FE] via-[#33FF67] to-[#7484FE] bg-clip-text text-transparent transition-all duration-600 ${
            phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          E-SUMMIT 2K26
        </div>

        {/* Phase 3: INTERNSHIP DRIVE Reveal */}
        <div
          className={`mt-6 flex flex-col items-center transition-all duration-700 ${
            phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#33FF67] to-transparent mb-5" />

          <div className="relative inline-block">
            <span className="font-display font-black tracking-[0.18em] text-3xl sm:text-5xl md:text-6xl text-[#F7F2F6] uppercase drop-shadow-[0_0_24px_rgba(116,132,254,0.4)]">
              INTERNSHIP DRIVE
            </span>
          </div>

          <p className="mt-3 font-mono text-xs sm:text-sm tracking-widest text-[#F7F2F6]/60 uppercase">
            Centre for Innovation & Entrepreneurship · MLRIT Hyderabad
          </p>
        </div>
      </div>

      {/* Bottom hint line */}
      <div className="absolute bottom-6 font-mono text-[10px] tracking-widest text-[#F7F2F6]/40 uppercase">
        CLICK ANYWHERE OR PRESS ESC TO SKIP
      </div>
    </div>
  );
}
