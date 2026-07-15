import { useState, useRef, useEffect } from "react";
import { Mic, Search, ScanLine } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useHudStore } from "@/stores/hudStore";
import { mahaBus } from "@/lib/system/eventBus";
import { initializeHudBridge } from "@/lib/system/hudBridge";
import { webSearch } from "@/lib/search.functions";
import { extractTextFromImage } from "@/lib/vision.functions";



const DEMO_SCRIPT: { role: "user" | "assistant"; content: string }[] = [
  { role: "user", content: "Status report." },
  { role: "assistant", content: "All systems nominal. Two items pending before noon." },
  { role: "user", content: "Push them to one o'clock." },
  { role: "assistant", content: "Rescheduled. I'll notify you at thirteen-hundred." },
];

const TOOLS = [
  { id: "memory", label: "MEMORY", y: 40 },
  { id: "calendar", label: "CALENDAR", y: 110 },
  { id: "search", label: "SEARCH", y: 180 },
  { id: "tasks", label: "TASKS", y: 250 },
  { id: "voice", label: "VOICE I/O", y: 320 },
];

// which tools light up per demo step, to simulate real lookups
const ACTIVE_MAP = [["calendar", "memory"], [], ["tasks", "calendar"], []];

type Msg = { role: "user" | "assistant"; content: string };

let hudBridgeReady = false;

export default function MahaJarvisUI() {
  const status = useHudStore((s) => s.status);
  const activeTools = useHudStore((s) => s.activeTools);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [clock, setClock] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useServerFn(webSearch);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAnswer, setSearchAnswer] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q || searchLoading) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchAnswer("");
    mahaBus.emit("tool:start", { name: "search" });
    try {
      const { answer } = await runSearch({ data: { query: q } });
      setSearchAnswer(answer);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      mahaBus.emit("tool:end", { name: "search" });
      setSearchLoading(false);
    }
  }

  const runVision = useServerFn(extractTextFromImage);
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");

  async function handleCaptureScreen() {
    if (ocrLoading) return;
    setOcrError("");
    setOcrText("");
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => setTimeout(r, 150));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      stream.getTracks().forEach((t) => t.stop());
      stream = null;

      setOcrLoading(true);
      mahaBus.emit("tool:start", { name: "search" });
      const { text } = await runVision({ data: { imageDataUrl: dataUrl } });
      setOcrText(text || "(no text detected)");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/Permission denied|dismissed|aborted/i.test(msg)) setOcrError(msg);
    } finally {
      stream?.getTracks().forEach((t) => t.stop());
      mahaBus.emit("tool:end", { name: "search" });
      setOcrLoading(false);
    }
  }

  useEffect(() => {
    if (!hudBridgeReady) {
      initializeHudBridge();
      hudBridgeReady = true;
    }
    const tick = () => setClock(new Date().toTimeString().slice(0, 8));
    tick();
    const iv = setInterval(tick, 1000);
    return () => {
      clearInterval(iv);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleMicPress() {
    if (status !== "idle") return;
    if (stepIndex >= DEMO_SCRIPT.length) {
      setMessages([]);
      setStepIndex(0);
      return;
    }
    const userTurn = DEMO_SCRIPT[stepIndex];
    mahaBus.emit("voice:start");
    mahaBus.emit("tool:start", { name: "voice" });

    timeoutRef.current = setTimeout(() => {
      setMessages((m) => [...m, userTurn]);
      mahaBus.emit("tool:end", { name: "voice" });
      mahaBus.emit("voice:end");
      const toolsForStep = ACTIVE_MAP[stepIndex] || [];
      toolsForStep.forEach((name) => mahaBus.emit("tool:start", { name }));

      timeoutRef.current = setTimeout(() => {
        const assistantTurn = DEMO_SCRIPT[stepIndex + 1];
        toolsForStep.forEach((name) => mahaBus.emit("tool:end", { name }));
        mahaBus.emit("thinking:end");
        mahaBus.emit("tool:start", { name: "voice" });
        setMessages((m) => [...m, assistantTurn]);

        timeoutRef.current = setTimeout(() => {
          mahaBus.emit("tool:end", { name: "voice" });
          useHudStore.getState().setStatus("idle");
          setStepIndex(stepIndex + 2);
        }, 1700);
      }, 1200);
    }, 1300);
  }


  const statusLabel = {
    idle: "STANDBY",
    listening: "LISTENING",
    thinking: "PROCESSING",
    speaking: "RESPONDING",
  }[status];

  const ringColor = status === "thinking" ? "#FF9F45" : "#4FD8FF";

  return (
    <div
      style={{
        minHeight: 700,
        background: "#05080C",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 16,
        padding: 20,
        fontFamily: "'Share Tech Mono', monospace",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Share+Tech+Mono&display=swap');
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes spin-fast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-core { 0%,100% { opacity:0.8; transform:scale(1);} 50% { opacity:1; transform:scale(1.06);} }
        @keyframes radar-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scanline { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
        @keyframes flicker { 0%,100% {opacity:1;} 92% {opacity:1;} 93% {opacity:0.4;} 94% {opacity:1;} }
        @keyframes bar-bounce { 0%,100% { height:6px; } 50% { height:26px; } }
        @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
        @keyframes node-pulse { 0%,100% { r: 4; opacity: 1; } 50% { r: 6; opacity: 0.6; } }
        @keyframes dash-flow { to { stroke-dashoffset: -20; } }
        .maha-log::-webkit-scrollbar { width: 3px; }
        .maha-log::-webkit-scrollbar-thumb { background: #16232E; }
      `}</style>

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", opacity: 0.06 }}>
        <div style={{ width: "100%", height: "40%", background: "linear-gradient(180deg, transparent, #4FD8FF, transparent)", animation: "scanline 5s linear infinite" }} />
      </div>

      {/* MAIN HUD */}
      <div style={{ width: 380, position: "relative", zIndex: 1 }}>
        {[
          { top: 0, left: 0, borderTop: "2px solid #4FD8FF", borderLeft: "2px solid #4FD8FF" },
          { top: 0, right: 0, borderTop: "2px solid #4FD8FF", borderRight: "2px solid #4FD8FF" },
          { bottom: 0, left: 0, borderBottom: "2px solid #4FD8FF", borderLeft: "2px solid #4FD8FF" },
          { bottom: 0, right: 0, borderBottom: "2px solid #4FD8FF", borderRight: "2px solid #4FD8FF" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 22, height: 22, opacity: 0.6, ...s }} />
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 6, padding: "0 4px" }}>
          <span style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 20, color: "#E8F6FF", letterSpacing: 4 }}>M.A.H.A</span>
          <span style={{ fontSize: 11, color: "#4C6270", letterSpacing: 1 }}>{clock}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4C6270", marginBottom: 8, letterSpacing: 1, padding: "0 4px" }}>
          <span>SYS.ONLINE</span>
          <span style={{ color: ringColor, animation: status !== "idle" ? "flicker 2s infinite" : "none" }}>[{statusLabel}]</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 240, height: 240, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", border: `1px solid ${ringColor}33`, borderTop: `1px solid ${ringColor}`, animation: "spin-slow 8s linear infinite" }} />
            <div style={{ position: "absolute", width: 190, height: 190, borderRadius: "50%", border: `1px dashed ${ringColor}55`, animation: "spin-rev 12s linear infinite" }} />
            <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", border: `1.5px solid ${ringColor}`, borderRight: "1.5px solid transparent", borderBottom: "1.5px solid transparent", animation: `spin-fast ${status === "thinking" ? 1.2 : status === "listening" ? 3 : 6}s linear infinite` }} />

            {status === "listening" && (
              <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", overflow: "hidden", animation: "radar-sweep 2s linear infinite" }}>
                <div style={{ width: "50%", height: "50%", background: `linear-gradient(90deg, transparent, ${ringColor}55)`, transformOrigin: "bottom right" }} />
              </div>
            )}

            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", width: 2, height: i % 6 === 0 ? 10 : 5, background: `${ringColor}66`, top: 6, left: "50%", transformOrigin: "50% 114px", transform: `translateX(-50%) rotate(${i * 15}deg)` }} />
            ))}

            <div style={{ width: 78, height: 78, borderRadius: "50%", background: `radial-gradient(circle, ${ringColor}dd, ${ringColor}22 70%)`, boxShadow: `0 0 ${status === "idle" ? 20 : 42}px ${ringColor}88`, animation: "pulse-core 2.4s ease-in-out infinite" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 3, height: 28, marginBottom: 20 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ width: 2, background: ringColor, opacity: status === "speaking" ? 0.9 : 0.25, height: status === "speaking" ? undefined : 4, animation: status === "speaking" ? `bar-bounce ${0.5 + (i % 5) * 0.08}s ease-in-out infinite` : "none", animationDelay: `${i * 0.03}s` }} />
            ))}
          </div>

          <div className="maha-log" style={{ width: "100%", flex: 1, minHeight: 130, maxHeight: 170, overflowY: "auto", border: "1px solid #16232E", background: "rgba(79,216,255,0.02)", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.7, marginBottom: 22 }}>
            {messages.length === 0 && <div style={{ color: "#2E3D48" }}>{"// awaiting input"}</div>}
            {messages.map((m, i) => (
              <div key={i} style={{ animation: "fade-in 0.3s ease", color: m.role === "user" ? "#8FA5B0" : "#4FD8FF" }}>
                <span style={{ color: m.role === "user" ? "#4C6270" : "#FF9F45" }}>{m.role === "user" ? "> " : "» "}</span>
                {m.content}
              </div>
            ))}
          </div>

          <button
            onClick={handleMicPress}
            aria-label="Talk to Maha"
            style={{ width: 60, height: 60, borderRadius: "50%", border: `1px solid ${status === "idle" ? "#16232E" : ringColor}`, background: "#0A0F14", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color 0.3s, transform 0.15s" }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Mic size={20} color={status === "idle" ? "#4C6270" : ringColor} strokeWidth={1.6} />
          </button>
        </div>

        {/* WEB SEARCH PANEL */}
        <div style={{ marginTop: 24, borderTop: "1px solid #16232E", paddingTop: 14 }}>
          <div style={{ fontSize: 10, color: "#4C6270", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Search size={11} strokeWidth={1.6} /> WEB SEARCH
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="query the net"
              disabled={searchLoading}
              style={{
                flex: 1, background: "#0A0F14", border: "1px solid #16232E", color: "#E8F6FF",
                padding: "8px 10px", fontFamily: "inherit", fontSize: 12, outline: "none",
                letterSpacing: 0.5,
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
              style={{
                background: "#0A0F14", border: `1px solid ${searchLoading ? ringColor : "#16232E"}`,
                color: searchLoading ? ringColor : "#8FA5B0", padding: "0 12px",
                fontFamily: "inherit", fontSize: 11, letterSpacing: 1, cursor: "pointer",
              }}
            >
              {searchLoading ? "..." : "RUN"}
            </button>
          </div>
          {(searchAnswer || searchError) && (
            <div
              className="maha-log"
              style={{
                marginTop: 10, maxHeight: 200, overflowY: "auto",
                border: "1px solid #16232E", background: "rgba(79,216,255,0.02)",
                padding: "10px 12px", fontSize: 12, lineHeight: 1.6,
                color: searchError ? "#FF6B6B" : "#8FA5B0", whiteSpace: "pre-wrap",
                animation: "fade-in 0.3s ease",
              }}
            >
              {searchError || searchAnswer}
            </div>
          )}
        </div>

        {/* SCREEN CAPTURE + OCR PANEL */}
        <div style={{ marginTop: 18, borderTop: "1px solid #16232E", paddingTop: 14 }}>
          <div style={{ fontSize: 10, color: "#4C6270", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <ScanLine size={11} strokeWidth={1.6} /> SCREEN OCR
          </div>
          <button
            onClick={handleCaptureScreen}
            disabled={ocrLoading}
            style={{
              width: "100%", background: "#0A0F14",
              border: `1px solid ${ocrLoading ? ringColor : "#16232E"}`,
              color: ocrLoading ? ringColor : "#8FA5B0", padding: "8px 10px",
              fontFamily: "inherit", fontSize: 11, letterSpacing: 1, cursor: "pointer",
            }}
          >
            {ocrLoading ? "READING…" : "CAPTURE SCREEN"}
          </button>
          {(ocrText || ocrError) && (
            <div
              className="maha-log"
              style={{
                marginTop: 10, maxHeight: 220, overflowY: "auto",
                border: "1px solid #16232E", background: "rgba(79,216,255,0.02)",
                padding: "10px 12px", fontSize: 12, lineHeight: 1.6,
                color: ocrError ? "#FF6B6B" : "#8FA5B0", whiteSpace: "pre-wrap",
                animation: "fade-in 0.3s ease",
              }}
            >
              {ocrError || ocrText}
            </div>
          )}
        </div>
      </div>



      {/* TOOL GRAPH SIDE PANEL */}
      <div style={{ width: 200, position: "relative", zIndex: 1, paddingTop: 6 }}>
        <div style={{ fontSize: 10, color: "#4C6270", letterSpacing: 1, marginBottom: 14, borderBottom: "1px solid #16232E", paddingBottom: 8 }}>
          CONNECTED SYSTEMS
        </div>

        <svg width="200" height="380" style={{ overflow: "visible" }}>
          {/* spine */}
          <line x1="18" y1="40" x2="18" y2="320" stroke="#16232E" strokeWidth="1" />
          {TOOLS.map((t) => {
            const isActive = activeTools.includes(t.id);
            const color = isActive ? ringColor : "#3A4B57";
            return (
              <g key={t.id}>
                <path
                  d={`M18,${t.y} C50,${t.y} 40,${t.y} 60,${t.y}`}
                  stroke={color}
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray={isActive ? "4 3" : "none"}
                  style={isActive ? { animation: "dash-flow 0.6s linear infinite" } : undefined}
                />
                <circle cx="18" cy={t.y} r="4" fill={color} style={isActive ? { animation: "node-pulse 1s ease-in-out infinite" } : undefined} />
              </g>
            );
          })}
        </svg>

        <div style={{ marginTop: -380, marginLeft: 60 }}>
          {TOOLS.map((t) => {
            const isActive = activeTools.includes(t.id);
            return (
              <div key={t.id} style={{ position: "relative", top: t.y - 6, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 11, letterSpacing: 1, color: isActive ? "#E8F6FF" : "#5C7A8C", animation: isActive ? "flicker 1.5s infinite" : "none" }}>
                  {t.label}
                </span>
                <span style={{ fontSize: 9, color: isActive ? ringColor : "#2E3D48" }}>
                  {isActive ? "ACTIVE" : "READY"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
