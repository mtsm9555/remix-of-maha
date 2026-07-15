import ReactorCore from "@/components/maha/ReactorCore";
import LiveToolGraph from "@/components/maha/LiveToolGraph";
import MemoryGraph from "@/components/maha/MemoryGraph";
import PlannerAgentPanel from "@/components/maha/PlannerAgentPanel";
import NotificationCenter from "@/components/maha/NotificationCenter";
import VisionPanel from "@/components/maha/VisionPanel";
import { useNavigate } from "@tanstack/react-router";
import { Mic, Cpu, Brain, Bell, Settings } from "lucide-react";

export default function MahaDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#05080C] text-white overflow-x-hidden">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 h-14 border-b border-[#152533] bg-[#05080C]/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="h-full px-3 md:px-4 flex items-center justify-between gap-3">
          <h1 className="text-cyan-300 tracking-[0.25em] md:tracking-[0.35em] font-bold text-sm md:text-base truncate">
            MAHA OS
          </h1>
          <div className="hidden md:flex gap-6 text-xs text-cyan-300 shrink-0">
            <span>VOICE ONLINE</span>
            <span>MEMORY READY</span>
            <span>TOOLS READY</span>
          </div>
          <div className="md:hidden flex items-center gap-1 text-[10px] text-cyan-300/80 shrink-0">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            ONLINE
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-3 md:p-4 pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-4">
        <div className="grid gap-3 md:gap-4 lg:grid-cols-12">
          {/* TOOL GRAPH */}
          <section className="lg:col-span-3">
            <div className="rounded-xl border border-[#152533] bg-[#0B1118] p-3 overflow-hidden">
              <div className="mb-3 flex items-center gap-2 text-cyan-300">
                <Cpu size={16} />
                <span className="text-xs tracking-[0.2em]">TOOL NETWORK</span>
              </div>
              <LiveToolGraph activeTools={[]} />
            </div>
          </section>

          {/* REACTOR */}
          <section className="lg:col-span-6 order-first lg:order-none">
            <div className="rounded-xl border border-[#152533] bg-[#0B1118] p-2 md:p-4 overflow-hidden">
              <div className="flex justify-center items-center min-h-[260px] sm:min-h-[360px] md:min-h-[500px]">
                <div className="scale-[0.55] sm:scale-[0.75] md:scale-90 lg:scale-100 origin-center">
                  <ReactorCore state="idle" />
                </div>
              </div>
            </div>
          </section>

          {/* MEMORY */}
          <section className="lg:col-span-3">
            <div className="rounded-xl border border-[#152533] bg-[#0B1118] p-3 overflow-hidden">
              <div className="mb-3 flex items-center gap-2 text-cyan-300">
                <Brain size={16} />
                <span className="text-xs tracking-[0.2em]">MEMORY GRAPH</span>
              </div>
              <MemoryGraph />
            </div>
          </section>

          {/* PLANNER */}
          <section className="lg:col-span-4">
            <PlannerAgentPanel
              goal="Build Maha AI Assistant"
              steps={[
                { id: "1", title: "Analyze request", tool: "planner", status: "completed" },
                { id: "2", title: "Select tools", tool: "router", status: "completed" },
                { id: "3", title: "Execute workflow", tool: "executor", status: "running" },
              ]}
            />
          </section>

          {/* NOTIFICATIONS */}
          <section className="lg:col-span-4">
            <NotificationCenter
              notifications={[
                {
                  id: "1",
                  title: "Memory Loaded",
                  message: "User profile restored",
                  time: "22:31",
                  type: "memory",
                },
                {
                  id: "2",
                  title: "Search Complete",
                  message: "Tool execution finished",
                  time: "22:32",
                  type: "success",
                },
              ]}
            />
          </section>

          {/* VISION */}
          <section className="lg:col-span-4">
            <VisionPanel
              status="idle"
              detections={[
                { id: "1", label: "Monitor", confidence: 98 },
                { id: "2", label: "Keyboard", confidence: 96 },
              ]}
              ocrText={`MAHA OS ONLINE\nVOICE READY\nMEMORY READY`}
            />
          </section>
        </div>
      </main>

      {/* FLOATING MIC (mobile only) */}
      <button
        onClick={() => navigate({ to: "/voice" })}
        className="lg:hidden fixed right-4 z-50 w-14 h-14 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_#4FD8FF] active:scale-95 transition-all"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        aria-label="Activate microphone"
      >
        <Mic size={24} />
      </button>

      {/* MOBILE NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 lg:hidden border-t border-[#152533] bg-[#0B1118] flex justify-around items-center z-40"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button onClick={() => navigate({ to: "/" })} aria-label="Home" className="p-3 text-cyan-300 active:scale-90">
          <Cpu size={22} />
        </button>
        <button onClick={() => navigate({ to: "/chat" })} aria-label="Chat" className="p-3 text-cyan-300 active:scale-90">
          <Brain size={22} />
        </button>
        <button aria-label="Alerts" className="p-3 text-cyan-300 active:scale-90">
          <Bell size={22} />
        </button>
        <button onClick={() => navigate({ to: "/settings" })} aria-label="Settings" className="p-3 text-cyan-300 active:scale-90">
          <Settings size={22} />
        </button>
      </nav>
    </div>
  );
}
