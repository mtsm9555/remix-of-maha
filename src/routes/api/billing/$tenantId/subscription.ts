import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing/$tenantId/subscription")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const { SubscriptionManager } = await import(
          "@/backend/billing/SubscriptionManager.server"
        );
        const subscription = await SubscriptionManager.getActiveSubscription(params.tenantId);
        const plan = subscription ? await SubscriptionManager.getPlan(subscription.planId) : null;
        return Response.json({ subscription, plan });
      },
    },
  },
});