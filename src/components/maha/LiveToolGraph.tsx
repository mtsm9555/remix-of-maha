import { Wrench, Zap } from "lucide-react";

interface Props {
  activeTools: string[];
}

const KNOWN_TOOLS = ["memory", "search", "vision", "planner", "llm", "speech"];

export default function LiveToolGraph({ activeTools }: Props) {
  const tools = Array.from(new Set([...KNOWN_TOOLS, ...activeTools]));

  return (
    <div className="bg-[#0B1118] border border-[#152533] rounded-xl h-full flex flex-col">
      <div className="border-b border-[#152533] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench size={18} className="text-cyan-300" />
          <span className="tracking-[0.2em] text-cyan-300 text-sm">TOOL GRAPH</span>
        </div>
        <span className="text-xs text-slate-400">{activeTools.length} ACTIVE</span>
      </div>

      <div className="flex-1 p-4 grid grid-cols-2 gap-3 overflow-y-auto">
        {tools.map((tool) => {
          const active = activeTools.includes(tool);
          return (
            <div
              key={tool}
              className={`relative border rounded-lg p-3 text-xs flex items-center gap-2 transition-all ${
                active
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                  : "border-[#152533] bg-[#081018] text-slate-400"
              }`}
            >
              <Zap
                size={14}
                className={active ? "text-cyan-300 animate-pulse" : "text-slate-600"}
              />
              <span className="uppercase tracking-widest">{tool}</span>
              {active && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
