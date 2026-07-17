import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gpu/health")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json();
        const { GPUHealthMonitor } = await import("@/backend/infrastructure/gpu/GPUHealthMonitor.server");
        return Response.json({ metrics: await GPUHealthMonitor.recordMetrics(body.gpuId, body.metrics) });
      },
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const gpuId = url.searchParams.get("gpuId");
        if (!gpuId) return new Response("Missing gpuId", { status: 400 });
        const { GPUHealthMonitor } = await import("@/backend/infrastructure/gpu/GPUHealthMonitor.server");
        return Response.json({ metrics: await GPUHealthMonitor.getRecentMetrics(gpuId) });
      },
    },
  },
});