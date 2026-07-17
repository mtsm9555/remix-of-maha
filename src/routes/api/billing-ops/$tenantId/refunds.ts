import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing-ops/$tenantId/refunds")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const { RefundProcessor } = await import("@/backend/billing/RefundProcessor.server");
        return Response.json({ refunds: await RefundProcessor.getRefundHistory(params.tenantId) });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json();
        const { RefundProcessor } = await import("@/backend/billing/RefundProcessor.server");
        const refund = await RefundProcessor.initiateRefund(
          String(body.paymentId),
          Number(body.amountUSD),
          String(body.reason ?? "requested_by_customer"),
          userId,
        );
        return Response.json({ refund });
      },
    },
  },
});