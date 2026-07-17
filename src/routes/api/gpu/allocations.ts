import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gpu/allocations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = await request.json();
        const { GPUAllocationEngine } = await import("@/backend/infrastructure/gpu/GPUAllocationEngine.server");
        const alloc = await GPUAllocationEngine.allocateGPUs(
          { ...body, id: body.id ?? `req_${crypto.randomUUID()}`, createdAt: new Date(), metadata: body.metadata ?? {} },
          body.strategy ?? "best_fit",
        );
        return Response.json({ allocation: alloc });
      },
    },
  },
});