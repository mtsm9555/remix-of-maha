import ReactorCore from "@/components/maha/ReactorCore";
import LiveToolGraph from "@/components/maha/LiveToolGraph";
import MemoryGraph from "@/components/maha/MemoryGraph";
import PlannerAgentPanel from "@/components/maha/PlannerAgentPanel";
import NotificationCenter from "@/components/maha/NotificationCenter";
import VisionPanel from "@/components/maha/VisionPanel";

import { Mic, Cpu, Brain, Bell } from "lucide-react";

export default function MahaDashboard() {
  return (
    <div className="min-h-screen bg-[#05080C] text-white overflow-x-hidden">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 h-14 border-b border-[#152533] bg-[#05080C]/90 backdrop-blur">
        <div className="h-full px-4 flex items-center justify-between">
          <div>
            <h1 className="text-cyan-300 tracking-[0.35em] font-bold">MAHA OS</h1>
          </div>
          <div className="hidden md:flex gap-6 text-xs text-cyan-300">
            <span>VOICE ONLINE</span>
            <span>MEMORY READY</span>
            <span>TOOLS READY</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-3 md:p-4">
        <div className="grid gap-4 lg:grid-cols-12">
          {/* TOOL GRAPH */}
          <section className="lg:col-span-3">
            <div className="rounded-xl border border-[#152533] bg-[#0B1118] p-3">
              <div className="mb-3 flex items-center gap-2 text-cyan-300">
                <Cpu size={16} />
                <span className="text-xs tracking-[0.2em]">TOOL NETWORK</span>
              </div>
              <LiveToolGraph activeTools={[]} />
            </div>
          </section>

          {/* REACTOR */}
          <section className="lg:col-span-6">
            <div className="rounded-xl border border-[#152533] bg-[#0B1118] p-4">
              <div className="flex justify-center items-center min-h-[320px] md:min-h-[500px]">
                <div className="scale-[0.75] sm:scale-90 md:scale-100">
                  <ReactorCore state="idle" />
                </div>
              </div>
            </div>
          </section>

          {/* MEMORY */}
          <section className="lg:col-span-3">
            <div className="rounded-xl border border-[#152533] bg-[#0B1118] p-3">
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

      {/* MOBILE MIC BUTTON */}
      <button
        className="fixed bottom-24 right-5 md:right-8 w-16 h-16 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_40px_#4FD8FF] hover:scale-105 transition-all"
        aria-label="Activate microphone"
      >
        <Mic size={28} />
      </button>

      {/* MOBILE NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden h-16 border-t border-[#152533] bg-[#0B1118] flex justify-around items-center">
        <Cpu size={20} />
        <Brain size={20} />
        <Bell size={20} />
        <Mic size={20} />
      </nav>
    </div>
  );
}
