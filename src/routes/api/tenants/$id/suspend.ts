import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tenants/$id/suspend")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });
        const body = (await request.json().catch(() => ({}))) as { reason?: string };
        const { TenantStore } = await import("@/backend/tenant/TenantStore.server");
        await TenantStore.suspendTenant(params.id, body.reason ?? "Suspended by admin");
        return Response.json({ success: true });
      },
    },
  },
});