import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/apikeys/$tenantId/$keyId/usage")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
        const { ApiKeyUsageTracker } = await import("@/backend/tenant/apikeys/ApiKeyUsageTracker.server");
        return Response.json({ usage: await ApiKeyUsageTracker.getRecentUsage(params.keyId, limit) });
      },
    },
  },
});