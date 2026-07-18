import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AudioLines, Brain, Search, LayoutGrid, Play,
  Shield, Network, Wrench, Bot, Eye,
} from "lucide-react";
import "./os.css";

export const Route = createFileRoute("/os")({
  head: () => ({
    meta: [
      { title: "MAHA AI OS" },
      { name: "description", content: "MAHA AI OS — bento HUD interface." },
    ],
  }),
  component: OSPage,
});

const STATES = ["READY", "LISTENING", "THINKING", "SEARCHING", "PLANNING", "EXECUTING"];

const MISSIONS = [
  { label: "LISTENING", Icon: AudioLines, active: true },
  { label: "THINKING", Icon: Brain, active: false },
  { label: "SEARCHING", Icon: Search, active: false },
  { label: "PLANNING", Icon: LayoutGrid, active: false },
  { label: "EXECUTING", Icon: Play, active: false },
];

const AGENTS = [
  { label: "Memory Engine", Icon: Shield, status: "Active" },
  { label: "Knowledge Graph", Icon: Network, status: "Active" },
  { label: "Tool Router", Icon: Wrench, status: "Idle" },
  { label: "Automation Agent", Icon: Bot, status: "Active" },
  { label: "Vision Module", Icon: Eye, status: "Parsing" },
];

function OSPage() {
  const memoryCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const [clock, setClock] = useState("");
  const [status, setStatus] = useState("READY");
  const [metrics, setMetrics] = useState({ cpu: 14, mem: 4.8, net: 2, tmp: 32 });

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString(undefined, { hour12: false }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
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

  useEffect(() => {
    let idx = 0;
    const t = setInterval(() => {
      idx = (idx + 1) % STATES.length;
      setStatus(STATES[idx]);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Memory latent-space graph (bars)
  useEffect(() => {
    const canvas = memoryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const N = 32;
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const gap = 3;
      const bw = (W - (N - 1) * gap) / N;
      for (let i = 0; i < N; i++) {
        const h = Math.abs(Math.sin(i * 0.3 + Date.now() * 0.001)) * H * 0.85 + 4;
        const alpha = 0.15 + (h / H) * 0.6;
        ctx.fillStyle = `rgba(34,211,238,${alpha})`;
        ctx.fillRect(i * (bw + gap), H - h, bw, h);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // Voice wave (smooth sine)
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const bars = 60;
      const gap = 2;
      const bw = (W - (bars - 1) * gap) / bars;
      const t = Date.now() * 0.005;
      for (let i = 0; i < bars; i++) {
        const wave = Math.sin(i * 0.4 + t) * 0.4 + Math.sin(i * 0.2 + t * 1.3) * 0.4;
        const h = Math.abs(wave) * H * 0.9 + 2;
        ctx.fillStyle = "#22d3ee";
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 6;
        ctx.fillRect(i * (bw + gap), (H - h) / 2, bw, h);
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    setStatus("EXECUTING");
    setTimeout(() => setStatus("READY"), 2500);
  };

  return (
    <div className="maha-os">
      <div className="background-grid" />
      <div className="background-glow" />
      <div className="background-particles">
        {Array.from({ length: 32 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i * 0.7) % 12}s`,
              animationDuration: `${10 + (i % 6)}s`,
            }}
          />
        ))}
      </div>
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
          <div>MISSION · NEURAL_SYNC_04</div>
          <div className="status"><span className="dot" /> SYSTEMS OPERATIONAL</div>
        </div>
      </header>

      {/* Bento grid */}
      <div className="bento">
        {/* Mission + Metrics */}
        <section className="tile tile-mission">
          <div className="mission-head">
            <div className="tile-title"><span className="dot" /> Mission Status</div>
            <div className="mission-directive">
              <div className="label">Current Directive</div>
              <div className="value">Neural Optimization Phase II</div>
            </div>
            <ul className="mission-list">
              {MISSIONS.map(({ label, Icon, active }) => (
                <li key={label} className={active ? "active" : ""}>
                  <Icon size={14} />
                  <span style={{ minWidth: 84 }}>{label}</span>
                  <div className="bar"><i /></div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="divider" />
            <div className="tile-title" style={{ marginBottom: 12 }}>System Metrics</div>
            <div className="metrics-grid">
              <div className="metric-cell">
                <div className="lbl">CPU.LOAD</div>
                <div className="val">{metrics.cpu}%</div>
                <div className="tinybar"><i style={{ width: `${metrics.cpu}%` }} /></div>
              </div>
              <div className="metric-cell">
                <div className="lbl">MEM.USE</div>
                <div className="val">{metrics.mem}GB</div>
                <div className="tinybar"><i style={{ width: `${metrics.mem * 10}%` }} /></div>
              </div>
              <div className="metric-cell">
                <div className="lbl">NET.LAT</div>
                <div className="val">{metrics.net}ms</div>
                <div className="tinybar"><i style={{ width: `${metrics.net * 10}%` }} /></div>
              </div>
              <div className="metric-cell">
                <div className="lbl">CORE.TMP</div>
                <div className="val">{metrics.tmp}°C</div>
                <div className="tinybar"><i style={{ width: `${metrics.tmp * 2}%` }} /></div>
              </div>
            </div>
          </div>
        </section>

        {/* Core stage */}
        <section className="tile tile-core">
          <div className="core-topbar">
            <span className="brand">MAHA_OS // V.4.0.2</span>
            <span className="secure"><span className="dot" /> Secure Connection</span>
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
            <div className="state">// {status}</div>
          </div>

          <div className="voice-strip">
            <canvas ref={waveCanvasRef} />
            <div className="lbl">Awaiting Voice Input</div>
          </div>
        </section>

        {/* Memory */}
        <section className="tile tile-memory">
          <div className="memory-head">
            <div className="tile-title">Memory Latent Space</div>
            <div className="count">NODES: 4,192</div>
          </div>
          <canvas ref={memoryCanvasRef} />
        </section>

        {/* Command */}
        <section className="tile tile-command">
          <div className="cmd-input">
            <span className="prompt">CMD_&gt;</span>
            <input placeholder="Enter system command or neural query" onKeyDown={onKeyDown} />
            <button className="exec">EXEC</button>
          </div>
          <div className="log-strip">
            RECENT_LOGS · <b>[USER_AUTH_GRANTED]</b> · [CORE_UPGRADE_COMPLETE] · <b>[NEURAL_LINK_ESTABLISHED]</b> · [AGENT_M04_SYNCED]
          </div>
        </section>

        {/* Agents */}
        <section className="tile tile-agents">
          <div className="tile-title">Active Agents</div>
          <ul className="agents-list">
            {AGENTS.map(({ label, Icon, status: s }) => (
              <li key={label}>
                <div className="name"><Icon size={14} /> {label}</div>
                <div className={`badge ${s === "Idle" ? "idle" : ""}`}>{s}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
