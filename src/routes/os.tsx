import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Shield, Network, Wrench, Bot, Eye, Cpu, Activity,
  Mic, Brain, Play, Pause, Power,
} from "lucide-react";
import "./os.css";

export const Route = createFileRoute("/os")({
  head: () => ({
    meta: [
      { title: "MAHA AI OS" },
      { name: "description", content: "MAHA AI OS — neural HUD interface." },
    ],
  }),
  component: OSPage,
});

type Mode = "idle" | "listening" | "thinking" | "executing";
const MODES: Mode[] = ["idle", "listening", "thinking", "executing"];

const AGENTS = [
  { label: "Memory Engine", Icon: Shield, status: "Active" },
  { label: "Knowledge Graph", Icon: Network, status: "Active" },
  { label: "Tool Router", Icon: Wrench, status: "Idle" },
  { label: "Automation Agent", Icon: Bot, status: "Active" },
  { label: "Vision Module", Icon: Eye, status: "Parsing" },
];

const INITIAL_TASKS = ["Monitor AI Core", "Watch Metrics", "Track Agents"];

const ACTIVITIES = [
  "Voice Engine Initialized", "Memory Module Connected", "Neural Network Synced",
  "Knowledge Graph Updated", "Agent Network Online", "Search Pipeline Activated",
  "Execution Queue Created", "System Diagnostics Complete", "Context Analysis Started",
  "Task Scheduler Running", "Live Monitoring Enabled", "Data Stream Connected",
  "Reasoning Engine Ready", "Workflow Executed", "Response Generated",
];

const EXEC_LOGS = [
  "Analyzing Request...", "Loading Memory...", "Routing Tools...",
  "Generating Response...", "Executing Workflow...", "Updating Context...",
  "Running Agent...", "Saving Session...", "Processing Input...", "Preparing Output...",
];

function fmtTime(d = new Date()) {
  return d.toLocaleTimeString(undefined, { hour12: false });
}

export function OSPage() {
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const neuralCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleLayerRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [metrics, setMetrics] = useState({ cpu: 14, mem: 4.8, net: 2, tmp: 32 });
  const [timeline, setTimeline] = useState<{ msg: string; time: string }[]>([]);
  const [execLog, setExecLog] = useState<string[]>([]);
  const [tasks] = useState(INITIAL_TASKS);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString(undefined, { hour12: false }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Seed timeline on client only (avoids SSR hydration mismatch)
  useEffect(() => {
    setTimeline(ACTIVITIES.slice(0, 5).map((m) => ({ msg: m, time: fmtTime() })));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setMetrics({
        cpu: Math.round(Math.random() * 50 + 10),
        mem: +(Math.random() * 6 + 3).toFixed(1),
        net: Math.round(Math.random() * 8 + 1),
        tmp: Math.round(Math.random() * 15 + 28),
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  // Mode cycle for voice waveform
  useEffect(() => {
    const t = setInterval(() => {
      setMode(MODES[Math.floor(Math.random() * MODES.length)]);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Timeline live feed
  useEffect(() => {
    const t = setInterval(() => {
      const msg = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      setTimeline((prev) => [{ msg, time: fmtTime() }, ...prev].slice(0, 12));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Execution log
  useEffect(() => {
    const t = setInterval(() => {
      const msg = EXEC_LOGS[Math.floor(Math.random() * EXEC_LOGS.length)];
      setExecLog((prev) => [msg, ...prev].slice(0, 8));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Voice waveform — canvas (ported from waveform.js)
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const N = 120;
    const data = Array.from({ length: N }, () => Math.random() * 20);
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = "rgba(0,234,255,.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // update
      const scale = mode === "listening" ? 90 : mode === "thinking" ? 40 : mode === "executing" ? 70 : 12;
      for (let i = 0; i < N; i++) data[i] = Math.random() * scale;
      // glow strip
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "rgba(0,234,255,.1)");
      grad.addColorStop(0.5, "rgba(0,234,255,.5)");
      grad.addColorStop(1, "rgba(0,234,255,.1)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, H / 2 - 2, W, 4);
      // wave
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#00eaff";
      const slice = W / N;
      for (let i = 0; i < N; i++) {
        const x = i * slice;
        const y = H / 2 + Math.sin(i * 0.3) * data[i];
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // bars
      const bars = 50, gap = W / bars;
      for (let i = 0; i < bars; i++) {
        const v = Math.random() * (mode === "listening" ? 60 : mode === "executing" ? 50 : 15);
        ctx.fillStyle = "rgba(0,234,255,.6)";
        ctx.fillRect(i * gap, H / 2 - v / 2, 3, v);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [mode]);

  // Neural particles + connecting lines (ported from particles.js)
  useEffect(() => {
    const layer = particleLayerRef.current;
    const canvas = neuralCanvasRef.current;
    if (!layer || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const MAX = 60;
    const nodes: { el: HTMLSpanElement; x: number; y: number; sx: number; sy: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < MAX; i++) {
      const el = document.createElement("span");
      const size = Math.random() * 4 + 1;
      Object.assign(el.style, {
        position: "absolute",
        width: size + "px",
        height: size + "px",
        borderRadius: "50%",
        background: "#00eaff",
        boxShadow: "0 0 12px #00eaff",
        opacity: String(Math.random()),
        pointerEvents: "none",
      });
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      el.style.left = x + "px";
      el.style.top = y + "px";
      layer.appendChild(el);
      nodes.push({ el, x, y, sx: (Math.random() - 0.5) * 0.5, sy: (Math.random() - 0.5) * 0.5 });
    }

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      for (const p of nodes) {
        p.x += p.sx; p.y += p.sy;
        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;
        p.el.style.left = p.x + "px";
        p.el.style.top = p.y + "px";
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,234,255,${1 - d / 140})`;
            ctx.lineWidth = 1;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      nodes.forEach((n) => n.el.remove());
    };
  }, []);

  return (
    <div className="maha-os">
      <canvas ref={neuralCanvasRef} className="neural-canvas" />
      <div ref={particleLayerRef} className="particles-layer" />
      <div className="background-grid" />
      <div className="background-glow" />
      <div className="background-scanner" />

      {/* Header */}
      <header className="header-bar">
        <div className="brand-block">
          <div className="brand-mark"><span /></div>
          <div className="brand-name">
            MAHA AI OS
            <span>Neural Operating System · v4.0</span>
          </div>
        </div>
        <div className="header-right">
          <div className="clock">{clock}</div>
          <div>MODE · {mode.toUpperCase()}</div>
          <div className="status"><span className="dot" /> SYSTEMS OPERATIONAL</div>
        </div>
      </header>

      <div className="layout">
        {/* LEFT — Tasks + Timeline */}
        <aside className="col left-panel">
          <section className="hud-card">
            <h2><Activity size={12} /> Active Tasks</h2>
            <div className="task-list">
              {tasks.map((t) => (
                <div key={t} className="task-item"><span className="task-status" /> {t}</div>
              ))}
            </div>
          </section>

          <section className="hud-card grow">
            <h2><Cpu size={12} /> System Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-cell"><div className="lbl">CPU</div><div className="val">{metrics.cpu}%</div><div className="tinybar"><i style={{ width: `${metrics.cpu}%` }} /></div></div>
              <div className="metric-cell"><div className="lbl">MEM</div><div className="val">{metrics.mem}GB</div><div className="tinybar"><i style={{ width: `${metrics.mem * 10}%` }} /></div></div>
              <div className="metric-cell"><div className="lbl">NET</div><div className="val">{metrics.net}ms</div><div className="tinybar"><i style={{ width: `${metrics.net * 10}%` }} /></div></div>
              <div className="metric-cell"><div className="lbl">TMP</div><div className="val">{metrics.tmp}°</div><div className="tinybar"><i style={{ width: `${metrics.tmp * 2}%` }} /></div></div>
            </div>
          </section>

          <section className="hud-card grow">
            <h2>Mission Timeline</h2>
            <div id="timeline" className="timeline">
              {timeline.map((e, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-title">{e.msg}</div>
                  <div className="timeline-time">{e.time}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* CENTER — Core + Wave */}
        <main className="col center-panel">
          <section className="core-tile">
            <div className="core-topbar">
              <span className="brand">MAHA_OS // V.4.0.2</span>
              <span className="secure"><span className="dot" /> Secure Link</span>
            </div>

            <div className="callout c1"><b>OPT-78</b> · AES-256 · 6,582 PKT</div>
            <div className="callout c2"><b>NODE-05</b> · 0.98s · LOAD 34%</div>
            <div className="callout c3"><b>LINK-23</b> · 18ms · 1.2Gbps</div>
            <div className="callout c4"><b>SYS-CTRL</b> · ADAPTIVE ON</div>

            <div className="core-stage">
              <div className="ring-outer" />
              <div className="ring-mid" />
              <div className="ring-inner" />
              <div className="core-orb"><div className="diamond" /></div>
            </div>

            <div className="core-caption">
              <div className="title">MAHA</div>
              <div className="sub">AI Core</div>
              <div className="state">// {mode.toUpperCase()}</div>
            </div>
          </section>

          <section className="hud-card wave-tile">
            <h2>Voice Waveform</h2>
            <canvas id="voiceWave" ref={waveCanvasRef} />
          </section>
        </main>

        {/* RIGHT — Agents + Execution Log */}
        <aside className="col right-panel">
          <section className="hud-card">
            <h2>Active Agents</h2>
            <ul className="agents-list">
              {AGENTS.map(({ label, Icon, status: s }) => (
                <li key={label}>
                  <div className="name"><Icon size={14} /> {label}</div>
                  <div className={`badge ${s === "Idle" ? "idle" : ""}`}>{s}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="hud-card grow">
            <h2>Execution Log</h2>
            <div id="executionLog" className="execution-log">
              {execLog.map((e, i) => (
                <div key={i} className="execution-entry">
                  <span className="execution-dot" /> {e}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <nav className="hud-dock" aria-label="HUD controls">
        <button
          type="button"
          className={`dock-btn ${mode === "listening" ? "is-active" : ""}`}
          aria-label="Listen"
          aria-pressed={mode === "listening"}
          onClick={() => setMode("listening")}
        >
          <Mic size={20} aria-hidden />
          <span>Listen</span>
        </button>
        <button
          type="button"
          className={`dock-btn ${mode === "thinking" ? "is-active" : ""}`}
          aria-label="Think"
          aria-pressed={mode === "thinking"}
          onClick={() => setMode("thinking")}
        >
          <Brain size={20} aria-hidden />
          <span>Think</span>
        </button>
        <button
          type="button"
          className={`dock-btn ${mode === "executing" ? "is-active" : ""}`}
          aria-label="Execute"
          aria-pressed={mode === "executing"}
          onClick={() => {
            setMode("executing");
            setExecLog((prev) => [
              EXEC_LOGS[Math.floor(Math.random() * EXEC_LOGS.length)],
              ...prev,
            ].slice(0, 8));
          }}
        >
          <Play size={20} aria-hidden />
          <span>Execute</span>
        </button>
        <button
          type="button"
          className={`dock-btn ${mode === "idle" ? "is-active" : ""}`}
          aria-label="Idle"
          aria-pressed={mode === "idle"}
          onClick={() => setMode("idle")}
        >
          <Pause size={20} aria-hidden />
          <span>Idle</span>
        </button>
        <button
          type="button"
          className="dock-btn dock-btn-danger"
          aria-label="Clear log"
          onClick={() => {
            setExecLog([]);
            setTimeline([]);
          }}
        >
          <Power size={20} aria-hidden />
          <span>Clear</span>
        </button>
      </nav>
    </div>
  );
}
