import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import "./os.css";

export const Route = createFileRoute("/os")({
  head: () => ({
    meta: [
      { title: "MAHA AI OS" },
      { name: "description", content: "MAHA AI OS HUD interface." },
    ],
  }),
  component: OSPage,
});

const STATES = ["READY", "LISTENING", "THINKING", "SEARCHING", "PLANNING", "EXECUTING"];

function OSPage() {
  const memoryCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLUListElement>(null);
  const [clock, setClock] = useState("");
  const [status, setStatus] = useState("INITIALIZING");
  const [bars, setBars] = useState({ cpu: 40, memory: 50, network: 30, storage: 60 });

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    setClock(new Date().toLocaleTimeString());
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setBars({
        cpu: Math.random() * 70 + 20,
        memory: Math.random() * 60 + 30,
        network: Math.random() * 90 + 5,
        storage: Math.random() * 80 + 10,
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const canvas = memoryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 300;
    canvas.height = 180;
    const points: number[] = [];
    for (let i = 0; i < 40; i++) points.push(Math.random() * 120 + 20);
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = "#0071e3";
      ctx.lineWidth = 2;
      for (let i = 0; i < points.length; i++) {
        const x = i * 8;
        const y = canvas.height - points[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      points.shift();
      points.push(Math.random() * 120 + 20);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 300;
    canvas.height = 180;
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#0071e3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < 300; x++) {
        const y = 90 + Math.sin(x * 0.05 + Date.now() * 0.01) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const boot: Array<[number, string]> = [
      [1000, "INITIALIZING"],
      [2500, "LOADING AGENTS"],
      [4500, "CONNECTING MEMORY"],
      [6500, "READY"],
    ];
    const timers = boot.map(([ms, s]) => setTimeout(() => setStatus(s), ms));
    let idx = 0;
    const cycle = setInterval(() => {
      idx = (idx + 1) % STATES.length;
      setStatus(STATES[idx]);
    }, 8000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(cycle);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (!coreRef.current) return;
      const glow = Math.random() * 30 + 30;
      coreRef.current.style.boxShadow = `0 20px 60px -20px rgba(0,113,227,0.4), 0 0 ${glow}px rgba(0,113,227,0.25)`;
    }, 1200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const list = agentsRef.current;
      if (!list) return;
      const items = list.querySelectorAll("li");
      items.forEach((el) => {
        (el as HTMLElement).style.background = "transparent";
        (el as HTMLElement).style.color = "";
      });
      const pick = items[Math.floor(Math.random() * items.length)] as HTMLElement | undefined;
      if (pick) {
        pick.style.background = "rgba(0,113,227,0.06)";
      }
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    setStatus("PROCESSING");
    setTimeout(() => setStatus("EXECUTING"), 1000);
    setTimeout(() => setStatus("COMPLETE"), 3000);
    setTimeout(() => setStatus("READY"), 5000);
  };

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const monthYear = today.toLocaleDateString(undefined, { month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="maha-os">
      <div className="background-grid" />
      <div className="background-circuits" />

      <header className="topbar">
        <div className="logo-section">
          <div className="logo-ring" />
          <div>
            <h1>MAHA AI OS</h1>
            <span>v1.0.0</span>
          </div>
        </div>
        <div className="date-panel">
          <div className="day">{day}</div>
          <div className="date-info">
            <div>{monthYear}</div>
            <div>{clock}</div>
          </div>
        </div>
        <div className="system-status">
          SYSTEM STATUS
          <div className="status-indicator" />
        </div>
      </header>

      <div className="dashboard">
        <div className="column-left">
          <div className="hud-panel">
            <h2>MISSION STATUS</h2>
            {["LISTENING", "THINKING", "SEARCHING", "PLANNING", "EXECUTING"].map((m) => (
              <div className="mission-item" key={m}>
                <span>{m}</span>
                <div className="progress" />
              </div>
            ))}
          </div>
          <div className="hud-panel">
            <h2>SYSTEM METRICS</h2>
            {(["cpu", "memory", "network", "storage"] as const).map((k) => (
              <div className="metric" key={k}>
                {k.toUpperCase()}
                <div className="metric-bar">
                  <div style={{ width: `${bars[k]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="center-area">
          <div className="data-box box-a">OPT-78</div>
          <div className="data-box box-b">NODE-05</div>
          <div className="ai-core-container">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
            <div className="ring ring-4" />
            <div className="core-center" ref={coreRef}>
              <div className="core-glow" />
            </div>
          </div>
          <h1 className="core-title">MAHA</h1>
          <h2 className="core-subtitle">AI CORE</h2>
          <div className="ready-status">{status}</div>
        </div>

        <div className="column-right">
          <div className="hud-panel">
            <h2>ACTIVE AGENTS</h2>
            <ul className="agent-list" ref={agentsRef}>
              <li>MEMORY ENGINE</li>
              <li>KNOWLEDGE GRAPH</li>
              <li>TOOL ROUTER</li>
              <li>AUTOMATION AGENT</li>
              <li>VISION MODULE</li>
            </ul>
          </div>
          <div className="hud-panel">
            <h2>MEMORY GRAPH</h2>
            <canvas ref={memoryCanvasRef} />
          </div>
          <div className="hud-panel">
            <h2>VOICE WAVE</h2>
            <canvas ref={waveCanvasRef} />
          </div>
        </div>
      </div>

      <div className="command-dock">
        <button className="dock-btn">+</button>
        <button className="dock-grid">⋮⋮</button>
        <input type="text" placeholder="Ask MAHA anything..." onKeyDown={onKeyDown} />
        <button className="wave-button">
          <div className="wave-icon">
            <span /><span /><span /><span /><span />
          </div>
        </button>
      </div>
    </div>
  );
}