import { AgentOrchestrator } from "./core/orchestrator/AgentOrchestrator";
import { PlannerAgent } from "./agents/PlannerAgent";
import { ResearchAgent } from "./agents/ResearchAgent";
import { MemoryAgent } from "./agents/MemoryAgent";
import { VisionAgent } from "./agents/VisionAgent";
import { ExecutionAgent } from "./agents/ExecutionAgent";
import { mahaBus } from "@/lib/system/eventBus";

const orchestrator = new AgentOrchestrator();

orchestrator.registerAgent(new PlannerAgent());
orchestrator.registerAgent(new ResearchAgent());
orchestrator.registerAgent(new MemoryAgent());
orchestrator.registerAgent(new VisionAgent());
orchestrator.registerAgent(new ExecutionAgent());

// Bridge orchestrator events into the HUD bus
orchestrator.on("task_started", (ctx: any) => {
  mahaBus.emit("agent:start", { name: ctx?.assignedAgent });
});
orchestrator.on("task_completed", (ctx: any) => {
  mahaBus.emit("agent:end", { name: ctx?.assignedAgent });
});
orchestrator.on("task_failed", (ctx: any) => {
  mahaBus.emit("agent:end", { name: ctx?.assignedAgent });
});

export default orchestrator;