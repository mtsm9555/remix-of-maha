import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gpu/allocations/$id/release")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = await request.json().catch(() => ({} as { status?: "completed" | "failed" | "cancelled" }));
        const { GPUAllocationEngine } = await import("@/backend/infrastructure/gpu/GPUAllocationEngine.server");
        await GPUAllocationEngine.releaseAllocation(params.id, body.status ?? "completed");
        return Response.json({ ok: true });
      },
    },
  },
});