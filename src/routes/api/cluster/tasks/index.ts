import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cluster/tasks/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const url = new URL(request.url);
        const status = url.searchParams.get("status") as null | "pending" | "queued" | "running" | "completed" | "failed" | "cancelled";
        const tenantId = url.searchParams.get("tenantId") ?? undefined;
        const workerId = url.searchParams.get("workerId") ?? undefined;
        const { TaskDistributionEngine } = await import("@/backend/infrastructure/cluster/TaskDistributionEngine.server");
        const tasks = await TaskDistributionEngine.listTasks({
          status: status ?? undefined, tenantId, workerId, limit: 100,
        });
        return Response.json({ tasks });
      },
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json().catch(() => null) as null | {
          type?: string; payload?: Record<string, unknown>;
          priority?: "critical" | "high" | "normal" | "low";
          requiredCapabilities?: string[]; preferredRegion?: string; preferredWorkerId?: string;
          timeoutMs?: number; maxAttempts?: number;
          tenantId?: string; workspaceId?: string; metadata?: Record<string, unknown>;
        };
        if (!body?.type || !body.tenantId) return new Response("type and tenantId required", { status: 400 });
        const { TaskDistributionEngine } = await import("@/backend/infrastructure/cluster/TaskDistributionEngine.server");
        const task = await TaskDistributionEngine.submitTask(body.type, body.payload ?? {}, {
          priority: body.priority, requiredCapabilities: body.requiredCapabilities,
          preferredRegion: body.preferredRegion, preferredWorkerId: body.preferredWorkerId,
          timeoutMs: body.timeoutMs, maxAttempts: body.maxAttempts,
          tenantId: body.tenantId, workspaceId: body.workspaceId, metadata: body.metadata,
        });
        return Response.json({ task });
      },
    },
  },
});