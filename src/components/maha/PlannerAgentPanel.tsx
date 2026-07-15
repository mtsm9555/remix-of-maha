import { CheckCircle2, Loader2, Clock } from "lucide-react";

type StepStatus = "pending" | "running" | "completed";

interface PlanStep {
  id: string;
  title: string;
  tool?: string;
  status: StepStatus;
}

interface PlannerAgentPanelProps {
  goal: string;
  steps: PlanStep[];
}

export default function PlannerAgentPanel({ goal, steps }: PlannerAgentPanelProps) {
  return (
    <div className="bg-[#0B1118] border border-[#152533] rounded-xl p-5 w-full">
      <div className="mb-5">
        <div className="text-cyan-300 text-xs tracking-[0.25em] mb-2">PLANNER AGENT</div>
        <div className="text-white text-lg">{goal}</div>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center gap-4 p-3 rounded-lg border border-[#152533] bg-[#081018]"
          >
            <div className="w-8 text-cyan-300">{index + 1}</div>
            <div className="flex-1">
              <div className="text-white">{step.title}</div>
              {step.tool && (
                <div className="text-xs text-cyan-300 mt-1">TOOL → {step.tool}</div>
              )}
            </div>
            {step.status === "pending" && <Clock size={18} className="text-slate-400" />}
            {step.status === "running" && (
              <Loader2 size={18} className="text-cyan-300 animate-spin" />
            )}
            {step.status === "completed" && (
              <CheckCircle2 size={18} className="text-green-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
