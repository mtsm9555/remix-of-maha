import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing-ops/$tenantId/payments")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const { PaymentProcessor } = await import("@/backend/billing/PaymentProcessor.server");
        return Response.json({ payments: await PaymentProcessor.getPaymentHistory(params.tenantId) });
      },
    },
  },
});