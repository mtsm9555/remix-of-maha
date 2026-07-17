import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing-ops/$tenantId/invoices/$invoiceId/finalize")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const { InvoiceGenerator } = await import("@/backend/billing/InvoiceGenerator.server");
        const invoice = await InvoiceGenerator.finalizeInvoice(params.invoiceId);
        return Response.json({ invoice });
      },
    },
  },
});