import { useState } from "react";
import { Mic, Brain, Eye, Wrench, Settings, PanelRight } from "lucide-react";
import ReactorCore from "./ReactorCore";

export default function OSPage() {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#07101D] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_60%)]" />

      <header className="absolute top-0 left-0 right-0 z-20 px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-wider">MAHA AI OS</h1>
          <p className="text-xs tracking-[0.3em] text-cyan-400">V2.0</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-slate-400">System Status</p>
          <p className="text-cyan-400 font-semibold">Nominal</p>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="relative">
          <ReactorCore />
          <div className="absolute inset-0 blur-3xl bg-cyan-400/10 rounded-full pointer-events-none" />
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-6xl md:text-7xl font-bold tracking-[0.35em]">MAHA</h1>
          <p className="mt-2 text-cyan-400 tracking-[0.45em] text-sm uppercase">AI Core</p>
        </div>

        <div className="mt-8 w-full max-w-2xl">
          <div className="h-20 rounded-2xl border border-cyan-400/20 bg-[#0A172C]/70 backdrop-blur-lg flex items-center justify-center">
            <div className="flex gap-2 items-end h-10">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-cyan-400 animate-pulse"
                  style={{ height: `${10 + ((i * 13) % 40)}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl mt-10">
          <div className="h-16 rounded-full border border-cyan-400/30 bg-[#0A172C]/80 backdrop-blur-xl flex items-center px-6 shadow-[0_0_30px_rgba(34,211,238,.15)]">
            <input
              placeholder="Ask MAHA anything..."
              className="flex-1 bg-transparent outline-none text-white placeholder:text-cyan-400/50"
            />
            <button
              type="button"
              aria-label="Voice input"
              className="h-12 w-12 rounded-full border border-cyan-400 flex items-center justify-center hover:bg-cyan-400/10 transition"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDashboardOpen(true)}
          className="mt-6 px-6 py-3 rounded-full border border-cyan-400/30 bg-[#0A172C] text-cyan-400 tracking-widest text-xs hover:bg-cyan-400/10 transition"
        >
          OPEN ADVANCED DASHBOARD
        </button>
      </main>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        <DockButton icon={<Brain size={18} />} label="Memory" />
        <DockButton icon={<Eye size={18} />} label="Vision" />
        <DockButton icon={<Wrench size={18} />} label="Tools" />
        <DockButton icon={<Settings size={18} />} label="Settings" />
      </div>

      {dashboardOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-30"
            onClick={() => setDashboardOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-[#0A172C] border-l border-cyan-400/20 z-40 p-6 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Advanced Dashboard</h2>
              <button type="button" aria-label="Close dashboard" onClick={() => setDashboardOpen(false)}>
                <PanelRight />
              </button>
            </div>
            <div className="mt-8 space-y-4">
              <PanelCard title="Memory Graph" />
              <PanelCard title="Planner Agent" />
              <PanelCard title="Vision Module" />
              <PanelCard title="Tool Activity" />
              <PanelCard title="Notifications" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DockButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="h-12 w-12 rounded-full bg-[#0A172C] border border-cyan-400/20 flex items-center justify-center hover:bg-cyan-400/10 transition"
    >
      {icon}
    </button>
  );
}

function PanelCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[#07101D] p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-slate-400 mt-2">Connect existing MAHA module here.</p>
    </div>
  );
}