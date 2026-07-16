import { createFileRoute } from "@tanstack/react-router";
import { AgentDiscoveryService } from "@/backend/infrastructure/registry/AgentDiscoveryService";
import type { Department } from "@/backend/agents/departments/types";

export const Route = createFileRoute("/api/infrastructure/registry/capacity/$department")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const department = params.department as Department;
        const capacity = await AgentDiscoveryService.getDepartmentCapacity(department);
        return Response.json({ department, capacity });
      },
    },
  },
});