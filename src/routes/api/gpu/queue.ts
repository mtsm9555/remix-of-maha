import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gpu/queue")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = await request.json();
        const { GPUQueueManager } = await import("@/backend/infrastructure/gpu/GPUQueueManager.server");
        const item = await GPUQueueManager.enqueueRequest({
          ...body,
          id: body.id ?? `req_${crypto.randomUUID()}`,
          metadata: body.metadata ?? {},
          createdAt: new Date(),
        });
        return Response.json({ item });
      },
    },
  },
});