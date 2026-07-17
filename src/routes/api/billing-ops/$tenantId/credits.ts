import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing-ops/$tenantId/credits")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const url = new URL(request.url);
        const history = url.searchParams.get("history") === "1";
        const { CreditManager } = await import("@/backend/billing/CreditManager.server");
        const credits = history
          ? await CreditManager.getCreditHistory(params.tenantId)
          : await CreditManager.getAvailableCredits(params.tenantId);
        return Response.json({ credits });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { tenantRole } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        const role = await tenantRole(params.tenantId, userId);
        if (role !== "owner" && role !== "admin") return new Response("Forbidden", { status: 403 });
        const body = await request.json();
        const { CreditManager } = await import("@/backend/billing/CreditManager.server");
        const credit = await CreditManager.issueCredit(
          params.tenantId,
          Number(body.amountUSD),
          String(body.reason ?? "manual"),
          userId,
          body.expiresAt ? new Date(body.expiresAt) : undefined,
        );
        return Response.json({ credit });
      },
    },
  },
});