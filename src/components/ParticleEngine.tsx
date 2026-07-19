import { useEffect, useRef } from "react";
import type { AIState } from "@/services/stateMachine";
import { STATE_COLORS, PARTICLE_SPAWN_RATE } from "@/lib/stateColors";

interface Props {
  isSpeaking: boolean;
  volume: number;
  state?: AIState;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  opacity: number;
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export default function ParticleEngine({ isSpeaking, volume, state = "idle" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const isSpeakingRef = useRef(isSpeaking);
  const volumeRef = useRef(volume);
  const stateRef = useRef(state);

  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const spawnBurst = (multiplier = 1) => {
      const v = volumeRef.current;
      const count = Math.max(20, Math.floor(v * 1.5)) * multiplier;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1 + Math.random() * 4,
          life: 120,
          maxLife: 120,
          opacity: 1,
        });
      }
    };

    let previous = false;
    let raf = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const speaking = isSpeakingRef.current;
      const v = volumeRef.current;

      if (speaking && !previous) spawnBurst();
      const rate = PARTICLE_SPAWN_RATE[stateRef.current] ?? 0;
      if (rate > 0 && Math.random() < rate / 60) spawnBurst();
      if (v > 70) { spawnBurst(); spawnBurst(); spawnBurst(); }
      previous = speaking;

      const color = hexToRgb(STATE_COLORS[stateRef.current] ?? STATE_COLORS.idle);

      // Cap the particle pool to prevent runaway allocations under sustained load.
      if (particles.current.length > 400) {
        particles.current.splice(0, particles.current.length - 400);
      }
      particles.current = particles.current.filter((p) => p.life > 0);
      // shadowBlur is per-particle expensive; set once for the batch.
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgb(${color})`;
      ctx.fillStyle = `rgba(${color}, 1)`;
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life--;
        p.opacity = p.life / p.maxLife;
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (!reduce) raf = requestAnimationFrame(animate);
    };

    if (!reduce) animate();

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduce && !raf) {
        animate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      particles.current = [];
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-engine" aria-hidden="true" />;
}