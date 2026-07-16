import { createFileRoute } from "@tanstack/react-router";
import { AgentLifecycleManager } from "@/backend/infrastructure/lifecycle/AgentLifecycleManager";

export const Route = createFileRoute("/api/infrastructure/fleet/kill/$instanceId")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        let reason = "Manual kill by admin";
        try {
          const body = (await request.json()) as { reason?: string };
          if (body?.reason) reason = body.reason;
        } catch {
          /* body optional */
        }
        AgentLifecycleManager.forceDestroy(params.instanceId, reason);
        return Response.json({ success: true, message: `Instance ${params.instanceId} destroyed.` });
      },
    },
  },
});