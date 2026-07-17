import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gpu/queue/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const { GPUQueueManager } = await import("@/backend/infrastructure/gpu/GPUQueueManager.server");
        return Response.json(await GPUQueueManager.processQueue());
      },
    },
  },
});