import { useEffect, useRef } from "react";
import { theme } from "@/lib/maha/theme";
import type { AIState } from "@/services/stateMachine";
import { STATE_COLORS } from "@/lib/stateColors";

interface CircularWaveformProps {
  data?: Uint8Array | null;
  intensity?: number;
  state?: AIState;
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export default function CircularWaveform({ data, intensity = 0, state = "idle" }: CircularWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const intensityRef = useRef(0);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    dataRef.current = data ?? null;
  }, [data]);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

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
      const freq = dataRef.current;
      const boost = Math.min(intensityRef.current / 80, 1);
      for (let i = 0; i < bars; i++) {
        const angle = (Math.PI * 2 * i) / bars;
        const radius = 170;
        let amplitude: number;
        if (freq && freq.length) {
          amplitude = freq[i % freq.length] / 255;
        } else {
          amplitude = Math.abs(Math.sin(frame * 0.03 + i * 0.2)) * 0.6;
        }
        amplitude = Math.min(1, amplitude + boost * 0.35);
        const length = 10 + amplitude * 60;
        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;
        const x2 = cx + Math.cos(angle) * (radius + length);
        const y2 = cy + Math.sin(angle) * (radius + length);
        const color = hexToRgb(STATE_COLORS[stateRef.current]);
        ctx.strokeStyle = `rgba(${color}, ${0.4 + amplitude * 0.6})`;
        ctx.lineWidth = 1 + amplitude * 2;
        ctx.shadowBlur = amplitude * 20;
        ctx.shadowColor = theme.cyan;
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