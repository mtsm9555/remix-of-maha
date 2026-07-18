import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Brain, Search, LayoutGrid, Play, AudioLines, Shield, Network, Wrench, Bot, Eye, Plus, MoreHorizontal } from "lucide-react";
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

const MISSIONS = [
  { label: "LISTENING", Icon: AudioLines },
  { label: "THINKING", Icon: Brain },
  { label: "SEARCHING", Icon: Search },
  { label: "PLANNING", Icon: LayoutGrid },
  { label: "EXECUTING", Icon: Play },
];

const AGENTS = [
  { label: "MEMORY ENGINE", Icon: Shield },
  { label: "KNOWLEDGE GRAPH", Icon: Network },
  { label: "TOOL ROUTER", Icon: Wrench },
  { label: "AUTOMATION AGENT", Icon: Bot },
  { label: "VISION MODULE", Icon: Eye },
];

function OSPage() {
  const memoryCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState("");
  const [status, setStatus] = useState("READY");
  const [bars, setBars] = useState({ cpu: 23, memory: 42, network: 68, storage: 71 });

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString(undefined, { hour12: true })), 1000);
    setClock(new Date().toLocaleTimeString(undefined, { hour12: true }));
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setBars({
        cpu: Math.random() * 60 + 15,
        memory: Math.random() * 60 + 25,
        network: Math.random() * 70 + 20,
        storage: Math.random() * 40 + 50,
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  // Memory network graph
  useEffect(() => {
    const canvas = memoryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = 160);
    const nodes = Array.from({ length: 10 }, () => ({
      x: Math.random() * (W - 40) + 20,
      y: Math.random() * (H - 40) + 20,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // edges
      ctx.strokeStyle = "rgba(0,234,255,0.35)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 90) {
            ctx.globalAlpha = 1 - d / 90;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      // nodes
      nodes.forEach((n, i) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 10 || n.x > W - 10) n.vx *= -1;
        if (n.y < 10 || n.y > H - 10) n.vy *= -1;
        const r = i === 4 ? 6 : 4;
        ctx.fillStyle = "#00eaff";
        ctx.shadowColor = "#00eaff";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Voice wave bars
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = 120);
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const bars = 48;
      const gap = 3;
      const bw = (W - (bars - 1) * gap) / bars;
      for (let i = 0; i < bars; i++) {
        const h = Math.abs(Math.sin(i * 0.35 + Date.now() * 0.005)) * (H * 0.7) + 4;
        ctx.fillStyle = "#00eaff";
        ctx.shadowColor = "#00eaff";
        ctx.shadowBlur = 6;
        ctx.fillRect(i * (bw + gap), (H - h) / 2, bw, h);
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let idx = 0;
    const cycle = setInterval(() => {
      idx = (idx + 1) % STATES.length;
      setStatus(STATES[idx]);
    }, 4000);
    return () => clearInterval(cycle);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    setStatus("PROCESSING");
    setTimeout(() => setStatus("EXECUTING"), 800);
    setTimeout(() => setStatus("READY"), 3000);
  };

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const monthYear = today.toLocaleDateString(undefined, { month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="maha-os">
      <div className="background-grid" />
      <div className="background-circuits" />
      <div className="background-particles">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.7) % 12}s`, animationDuration: `${8 + (i % 6)}s` }} />
        ))}
      </div>
      <div className="background-scanner" />

      <header className="topbar">
        <div className="logo-section">
          <div className="logo-ring">
            <div className="logo-inner" />
          </div>
          <div>
            <h1>MAHA AI OS</h1>
            <span>v1.0.0</span>
          </div>
          <div className="dot-row">
            <span /><span /><span /><span /><span />
          </div>
        </div>

        <div className="date-panel">
          <div className="day">{day}</div>
          <div className="date-info">
            <div className="month">{monthYear}</div>
            <div className="clock">{clock}</div>
          </div>
        </div>

        <div className="system-status">
          <div className="ss-label">SYSTEM STATUS</div>
          <div className="ss-value">
            <div className="status-indicator" />
            ALL SYSTEMS OPERATIONAL
          </div>
        </div>

        <div className="corner-radar">
          <div className="radar-ring r1" />
          <div className="radar-ring r2" />
          <div className="radar-dot" />
        </div>
      </header>

      <div className="dashboard">
        {/* LEFT */}
        <div className="column-left">
          <div className="hud-panel">
            <div className="panel-head">
              <h2>MISSION STATUS</h2>
              <div className="mini-radar" />
            </div>
            {MISSIONS.map(({ label, Icon }) => (
              <div className="mission-item" key={label}>
                <div className="mission-icon"><Icon size={18} /></div>
                <div className="mission-body">
                  <span>{label}</span>
                  <div className="dot-progress">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <i key={i} className={i < 9 ? "on" : ""} />
                    ))}
                  </div>
                </div>
                <div className="mission-more">•••</div>
              </div>
            ))}
          </div>

          <div className="hud-panel">
            <h2>SYSTEM METRICS</h2>
            {(["cpu", "memory", "network", "storage"] as const).map((k) => (
              <div className="metric" key={k}>
                <div className="metric-head">
                  <span className="metric-label">{k === "cpu" ? "CPU USAGE" : k.toUpperCase()}</span>
                  <MiniChart seed={k} />
                </div>
                <div className="metric-value">{Math.round(bars[k])}%</div>
                <div className="metric-bar">
                  <div style={{ width: `${bars[k]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER */}
        <div className="center-area">
          <div className="floating-label top-center">
            <div className="fl-title">CORE STATUS</div>
            <div className="fl-value">ONLINE</div>
          </div>

          <div className="data-box box-a">
            <div className="db-title">OPT-78</div>
            <div className="db-row">DATA STREAM</div>
            <div className="db-row">SECURE LINK: <b>ACTIVE</b></div>
            <div className="db-row">ENCRYPTION: <b>AES-256</b></div>
            <div className="db-row">PACKETS: <b>6,582</b></div>
            <div className="db-row">STATUS: <b>STABLE</b></div>
          </div>

          <div className="data-box box-b">
            <div className="db-title">NODE-05</div>
            <div className="db-row">RESPONSE: <b>0.98s</b></div>
            <div className="db-row">LOAD: <b>34%</b></div>
            <div className="db-row">TEMP: <b>42°C</b></div>
            <div className="db-row">HEALTH: <b>OPTIMAL</b></div>
          </div>

          <div className="data-box box-c">
            <div className="db-title">LINK-23</div>
            <div className="db-row">CONNECTION: <b>STABLE</b></div>
            <div className="db-row">AVG LATENCY: <b>18ms</b></div>
            <div className="db-row">BANDWIDTH: <b>1.2Gbps</b></div>
          </div>

          <div className="data-box box-d">
            <div className="db-title">SYS-CTRL</div>
            <div className="db-row">AUTONOMOUS MODE</div>
            <div className="db-row">ADAPTIVE LEARNING: <b>ON</b></div>
            <div className="db-row">THREAT LEVEL: <b>MINIMAL</b></div>
          </div>

          <div className="ai-core-container">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
            <div className="ring ring-4" />
            <div className="ring-dashed" />
            <div className="core-center" ref={coreRef}>
              <div className="core-glow" />
            </div>
          </div>

          <div className="core-caption">
            <h1 className="core-title">MAHA</h1>
            <h2 className="core-subtitle">AI CORE</h2>
            <div className="ready-status">{status}</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="column-right">
          <div className="hud-panel">
            <div className="panel-head">
              <div>
                <h2>ACTIVE AGENTS</h2>
                <div className="big-count">05</div>
              </div>
              <button className="icon-btn"><Plus size={16} /></button>
            </div>
            <ul className="agent-list">
              {AGENTS.map(({ label, Icon }) => (
                <li key={label}>
                  <div className="agent-icon"><Icon size={16} /></div>
                  <div className="agent-body">
                    <div className="agent-name">{label}</div>
                    <div className="agent-status">ONLINE <span className="pulse-dot" /></div>
                  </div>
                  <div className="agent-more">⋮</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="hud-panel">
            <div className="panel-head">
              <h2>MEMORY GRAPH</h2>
              <div className="live-tag"><span className="pulse-dot" /> LIVE</div>
            </div>
            <canvas ref={memoryCanvasRef} className="net-canvas" />
          </div>

          <div className="hud-panel">
            <div className="panel-head">
              <h2>VOICE WAVE</h2>
              <div className="live-tag muted">LIVE FEED</div>
            </div>
            <canvas ref={waveCanvasRef} className="wave-canvas" />
          </div>
        </div>
      </div>

      <div className="command-dock">
        <button className="dock-btn"><Plus size={18} /></button>
        <button className="dock-grid">
          <div className="grid-3x3">
            {Array.from({ length: 9 }).map((_, i) => <i key={i} />)}
          </div>
        </button>
        <input type="text" placeholder="Ask MAHA anything..." onKeyDown={onKeyDown} />
        <button className="dock-btn"><MoreHorizontal size={18} /></button>
        <button className="wave-button">
          <div className="wave-icon">
            <span /><span /><span /><span /><span />
          </div>
        </button>
      </div>
    </div>
  );
}

function MiniChart({ seed }: { seed: string }) {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const s = seed.charCodeAt(0) + i;
    return 15 + Math.abs(Math.sin(s * 0.7)) * 20;
  });
  const path = pts.map((y, i) => `${i === 0 ? "M" : "L"}${i * 3},${40 - y}`).join(" ");
  return (
    <svg width="60" height="30" viewBox="0 0 60 40" className="mini-chart">
      <path d={path} fill="none" stroke="#00eaff" strokeWidth="1.2" />
    </svg>
  );
}
