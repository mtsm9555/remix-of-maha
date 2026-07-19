import { useEffect, useRef } from "react";

export default function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 50 : 100;

    let animationId = 0;
    let staticLayer: HTMLCanvasElement | null = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      staticLayer = buildStaticLayer();
    };

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2.5,
      speed: Math.random() * 0.4,
      opacity: Math.random() * 0.8,
    }));

    const drawGrid = (c: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "rgba(0,234,255,.04)";
      ctx.lineWidth = 1;
      const spacing = 80;
      c.strokeStyle = "rgba(0,234,255,.04)";
      c.lineWidth = 1;
      c.beginPath();
      for (let x = 0; x < canvas.width; x += spacing) {
        c.moveTo(x, 0);
        c.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        c.moveTo(0, y);
        c.lineTo(canvas.width, y);
      }
      c.stroke();
    };

    const drawParticles = () => {
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(0,234,255,${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Circuits are static — draw once to an offscreen canvas and blit each frame.
    const buildStaticLayer = (): HTMLCanvasElement => {
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const octx = off.getContext("2d");
      if (!octx) return off;
      drawGrid(octx);
      octx.strokeStyle = "rgba(0,234,255,.06)";
      octx.lineWidth = 2;
      const circuitCount = isMobile ? 5 : 10;
      for (let i = 0; i < circuitCount; i++) {
        const sx = Math.random() * canvas.width;
        const sy = Math.random() * canvas.height;
        octx.beginPath();
        octx.moveTo(sx, sy);
        octx.lineTo(sx + 120, sy);
        octx.lineTo(sx + 120, sy + 80);
        octx.stroke();
      }
      return off;
    };

    let scanPosition = 0;
    const drawScan = () => {
      scanPosition += 1.5;
      if (scanPosition > canvas.height) scanPosition = 0;
      const g = ctx.createLinearGradient(0, scanPosition - 80, 0, scanPosition + 80);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, "rgba(0,234,255,.08)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, scanPosition - 80, canvas.width, 160);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (staticLayer) ctx.drawImage(staticLayer, 0, 0);
      drawParticles();
      drawScan();
    };

    const animate = () => {
      drawStatic();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduce) {
      drawStatic();
    } else {
      animate();
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      } else if (!reduce && !animationId) {
        animate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="background-fx" aria-hidden="true" />
      <div className="bg-vignette" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />
    </>
  );
}