import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, MessageSquare } from "lucide-react";
import { MahaChatInterface } from "@/components/MahaChatInterface";
import { AgentDashboard } from "@/components/AgentDashboard";

export const Route = createFileRoute("/maha")({
  head: () => ({
    meta: [
      { title: "Maha AI OS — Command Center" },
      { name: "description", content: "Cloud-native multi-agent operating system chat and dashboard." },
    ],
  }),
  component: MahaPage,
});

function MahaPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard">("chat");
  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 font-sans overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]" />
      <div className="relative z-10 flex flex-col h-screen max-w-7xl mx-auto p-4 md:p-6 gap-6">
        <header className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <span className="text-cyan-400 font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-cyan-400">MAHA AI OS</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest">CLOUD-NATIVE MULTI-AGENT OPERATING SYSTEM v2.0</p>
            </div>
          </div>
          <div className="flex bg-slate-900/50 border border-slate-800 rounded-lg p-1">
            <button onClick={() => setActiveTab("chat")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "chat" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-slate-400 hover:text-slate-200"}`}>
              <MessageSquare className="w-4 h-4" /> Interface
            </button>
            <button onClick={() => setActiveTab("dashboard")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "dashboard" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-slate-400 hover:text-slate-200"}`}>
              <LayoutDashboard className="w-4 h-4" /> Command Center
            </button>
          </div>
        </header>
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 overflow-hidden">
          {activeTab === "chat" ? <MahaChatInterface /> : <div className="h-full overflow-y-auto pr-2"><AgentDashboard /></div>}
        </motion.main>
        <footer className="flex items-center justify-between text-[10px] font-mono text-slate-600 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> CORE: ONLINE</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> QUEUE: READY</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> DB: SYNCED</span>
          </div>
          <div>28 AGENTS ACTIVE • 8 DEPARTMENTS OPERATIONAL</div>
        </footer>
      </div>
    </div>
  );
}