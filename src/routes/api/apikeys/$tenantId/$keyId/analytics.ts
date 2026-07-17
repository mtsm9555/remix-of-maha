import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/apikeys/$tenantId/$keyId/analytics")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const url = new URL(request.url);
        const days = Math.min(Number(url.searchParams.get("days") ?? 30), 365);
        const { ApiKeyUsageTracker } = await import("@/backend/tenant/apikeys/ApiKeyUsageTracker.server");
        return Response.json({ analytics: await ApiKeyUsageTracker.getAnalytics(params.keyId, days) });
      },
    },
  },
});