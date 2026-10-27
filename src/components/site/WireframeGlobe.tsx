import { useEffect, useRef } from "react";

interface WireframeGlobeProps {
  size?: number;
  className?: string;
  speed?: number;
  strokeColor?: string;
  accentColor?: string;
}

export function WireframeGlobe({
  size = 100,
  className = "",
  speed = 0.008,
  strokeColor = "#F7F2F6",
  accentColor = "#7484FE",
}: WireframeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    const radius = size * 0.44;
    const centerX = size / 2;
    const centerY = size / 2;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Outer bounding rim
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Subtle atmospheric halo / back-glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.2,
        centerX,
        centerY,
        radius
      );
      glowGrad.addColorStop(0, "rgba(116, 132, 254, 0.08)");
      glowGrad.addColorStop(1, "rgba(42, 42, 42, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Draw latitude parallels (horizontal rings)
      const latCount = 7;
      for (let i = 1; i <= latCount; i++) {
        const latAngle = ((i - (latCount + 1) / 2) * Math.PI) / (latCount + 1);
        const yOffset = Math.sin(latAngle) * radius;
        const currentRadius = Math.cos(latAngle) * radius;

        if (currentRadius <= 0) continue;

        ctx.beginPath();
        // Slight tilt around X
        const tilt = 0.22;
        const rY = currentRadius * Math.abs(Math.sin(tilt));
        ctx.ellipse(centerX, centerY + yOffset, currentRadius, Math.max(rY, 2.5), 0, 0, Math.PI * 2);
        ctx.strokeStyle = i === 4 ? accentColor : "rgba(247, 242, 246, 0.38)";
        ctx.lineWidth = i === 4 ? 1.2 : 0.75;
        ctx.stroke();
      }

      // Draw rotating longitude meridians (vertical ellipses)
      const lonCount = 10;
      for (let i = 0; i < lonCount; i++) {
        const lonAngle = angle + (i * Math.PI) / lonCount;
        const effectiveWidth = Math.cos(lonAngle) * radius;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.max(Math.abs(effectiveWidth), 0.5), radius, 0.22, 0, Math.PI * 2);
        
        // Highlight leading edges
        const isFacing = Math.sin(lonAngle) > 0;
        ctx.strokeStyle = isFacing ? "rgba(247, 242, 246, 0.55)" : "rgba(116, 132, 254, 0.25)";
        ctx.lineWidth = isFacing ? 0.9 : 0.6;
        ctx.stroke();
      }

      angle += speed;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, speed, strokeColor, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`inline-block align-middle select-none pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
