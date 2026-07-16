import { createFileRoute } from "@tanstack/react-router";
import { AgentLifecycleManager } from "@/backend/infrastructure/lifecycle/AgentLifecycleManager";
import type { AgentInstanceConfig } from "@/backend/infrastructure/lifecycle/AgentLifecycleTypes";

export const Route = createFileRoute("/api/infrastructure/fleet/")({
  server: {
    handlers: {
      GET: async () => {
        const instances = AgentLifecycleManager.getActiveInstances();
        const fleetByDept: Record<
          string,
          { total: number; working: number; idle: number; paused: number; unhealthy: number }
        > = {};
        for (const inst of instances) {
          const dept = inst.config.department;
          if (!fleetByDept[dept])
            fleetByDept[dept] = { total: 0, working: 0, idle: 0, paused: 0, unhealthy: 0 };
          fleetByDept[dept].total++;
          if (inst.state === "WORKING") fleetByDept[dept].working++;
          if (inst.state === "IDLE") fleetByDept[dept].idle++;
          if (inst.state === "PAUSED") fleetByDept[dept].paused++;
          if (inst.state === "UNHEALTHY") fleetByDept[dept].unhealthy++;
        }
        return Response.json({ instances, fleetByDept });
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as Partial<AgentInstanceConfig>;
        if (!body.agentId || !body.department) {
          return new Response(JSON.stringify({ error: "agentId and department required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const instance = AgentLifecycleManager.spawnInstance({
          agentId: body.agentId,
          department: body.department,
          maxConcurrentTasks: body.maxConcurrentTasks ?? 1,
          maxIdleTimeMinutes: body.maxIdleTimeMinutes ?? 30,
          maxTaskDurationMinutes: body.maxTaskDurationMinutes ?? 10,
        });
        return Response.json({ success: true, instanceId: instance.instanceId });
      },
    },
  },
});