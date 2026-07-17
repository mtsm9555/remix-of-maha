import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing-ops/$tenantId/invoices/$invoiceId/pay")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { tenantRole } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        const role = await tenantRole(params.tenantId, userId);
        if (role !== "owner" && role !== "admin") return new Response("Forbidden", { status: 403 });
        const body = await request.json();
        const { PaymentProcessor } = await import("@/backend/billing/PaymentProcessor.server");
        const payment = await PaymentProcessor.processPayment(
          params.invoiceId,
          String(body.paymentMethodId ?? ""),
          body.amountUSD ? Number(body.amountUSD) : undefined,
        );
        return Response.json({ payment });
      },
    },
  },
});