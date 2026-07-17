import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models/test-routing")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as any;
        if (!body?.task || !body?.context?.tenantId) {
          return Response.json({ error: "task and context.tenantId required" }, { status: 400 });
        }
        const { ModelRoutingEngine } = await import("@/backend/infrastructure/models/ModelRoutingEngine.server");
        try {
          const req = {
            task: body.task,
            constraints: body.constraints ?? {},
            context: {
              tenantId: body.context.tenantId,
              workspaceId: body.context.workspaceId,
              userId: body.context.userId ?? "system",
              correlationId: body.context.correlationId ?? `test_${Date.now()}`,
            },
          };
          const decision = await ModelRoutingEngine.routeRequest(req);
          if (body.record) await ModelRoutingEngine.recordRoutingDecision(decision, req);
          return Response.json({ decision });
        } catch (err: any) {
          return Response.json({ error: err?.message ?? String(err) }, { status: 500 });
        }
      },
    },
  },
});