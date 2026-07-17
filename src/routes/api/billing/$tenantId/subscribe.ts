import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing/$tenantId/subscribe")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const body = (await request.json().catch(() => ({}))) as {
          planId?: string; billingCycle?: "monthly" | "yearly"; trialDays?: number;
        };
        if (!body.planId) return Response.json({ error: "planId required" }, { status: 400 });
        const { SubscriptionManager } = await import(
          "@/backend/billing/SubscriptionManager.server"
        );
        try {
          const subscription = await SubscriptionManager.createSubscription(
            params.tenantId, body.planId, body.billingCycle ?? "monthly", body.trialDays ?? 14,
          );
          return Response.json({ success: true, subscription });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 400 });
        }
      },
    },
  },
});