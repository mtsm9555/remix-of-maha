import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing/$tenantId/cancel")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const body = (await request.json().catch(() => ({}))) as { atPeriodEnd?: boolean };
        const { SubscriptionManager } = await import(
          "@/backend/billing/SubscriptionManager.server"
        );
        try {
          await SubscriptionManager.cancelSubscription(params.tenantId, body.atPeriodEnd ?? true);
          return Response.json({ success: true });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 400 });
        }
      },
    },
  },
});