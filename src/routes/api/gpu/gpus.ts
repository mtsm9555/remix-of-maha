import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gpu/gpus")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { GPUNodeManager } = await import("@/backend/infrastructure/gpu/GPUNodeManager.server");
        const url = new URL(request.url);
        const state = url.searchParams.get("state") ?? undefined;
        const model = url.searchParams.get("model") ?? undefined;
        return Response.json({ gpus: await GPUNodeManager.listGPUs({ state: state as never, model: model as never }) });
      },
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json();
        const { GPUNodeManager } = await import("@/backend/infrastructure/gpu/GPUNodeManager.server");
        return Response.json({ gpu: await GPUNodeManager.registerGPU(body) });
      },
    },
  },
});