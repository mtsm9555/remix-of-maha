import { useEffect, useRef } from "react";
import { theme } from "@/lib/maha/theme";

export default function CircularWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 500;

    let frame = 0;
    let raf = 0;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const bars = 180;
      for (let i = 0; i < bars; i++) {
        const angle = (Math.PI * 2 * i) / bars;
        const wave = Math.sin(frame * 0.03 + i * 0.2);
        const radius = 170;
        const length = 10 + Math.abs(wave) * 35;
        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;
        const x2 = cx + Math.cos(angle) * (radius + length);
        const y2 = cy + Math.sin(angle) * (radius + length);
        ctx.strokeStyle = theme.cyan;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const loop = () => {
      frame++;
      drawFrame();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (mq.matches) {
        drawFrame(); // render one static frame
      } else {
        loop();
      }
    };

    start();
    mq.addEventListener("change", start);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", start);
    };
  }, []);

  return <canvas ref={canvasRef} className="circular-wave" aria-hidden />;
}