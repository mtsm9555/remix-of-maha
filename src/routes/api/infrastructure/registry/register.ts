import { createFileRoute } from "@tanstack/react-router";
import { AgentRegistryStore } from "@/backend/infrastructure/registry/AgentRegistryStore";
import type { AgentMetadata } from "@/backend/infrastructure/registry/AgentRegistryTypes";

export const Route = createFileRoute("/api/infrastructure/registry/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = (await request.json()) as any;
        if (!raw?.instanceId || !raw?.agentType || !raw?.department || !raw?.network) {
          return new Response(
            JSON.stringify({ error: "instanceId, agentType, department, network required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        const metadata: AgentMetadata = {
          instanceId: raw.instanceId,
          agentType: raw.agentType,
          department: raw.department,
          network: {
            host: raw.network.host,
            port: Number(raw.network.port),
            protocol: raw.network.protocol ?? "http",
            executionEndpoint: raw.network.executionEndpoint ?? "/api/v1/execute",
          },
          capabilities: {
            tools: raw.capabilities?.tools ?? [],
            models: raw.capabilities?.models ?? [],
            languages: raw.capabilities?.languages ?? [],
            maxContextTokens: raw.capabilities?.maxContextTokens ?? 0,
          },
          currentLoad: Number(raw.currentLoad ?? 0),
          maxConcurrentTasks: Number(raw.maxConcurrentTasks ?? 1),
          registeredAt: raw.registeredAt ? new Date(raw.registeredAt) : new Date(),
          lastHeartbeat: new Date(),
          status: "healthy",
        };
        await AgentRegistryStore.registerAgent(metadata);
        return Response.json({ success: true });
      },
    },
  },
});