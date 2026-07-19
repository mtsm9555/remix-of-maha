import { useEffect, useRef } from "react";

export default function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2.5,
      speed: Math.random() * 0.4,
      opacity: Math.random() * 0.8,
    }));

    const drawGrid = () => {
      ctx.strokeStyle = "rgba(0,234,255,.04)";
      ctx.lineWidth = 1;
      const spacing = 80;
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
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

    const drawCircuits = () => {
      ctx.strokeStyle = "rgba(0,234,255,.06)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const sx = Math.random() * canvas.width;
        const sy = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 120, sy);
        ctx.lineTo(sx + 120, sy + 80);
        ctx.stroke();
      }
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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      drawParticles();
      drawCircuits();
      drawScan();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
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