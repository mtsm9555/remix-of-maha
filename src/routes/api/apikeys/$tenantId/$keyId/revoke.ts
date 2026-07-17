import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/apikeys/$tenantId/$keyId/revoke")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json().catch(() => ({}));
        const { AdvancedApiKeyManager } = await import("@/backend/tenant/apikeys/AdvancedApiKeyManager.server");
        await AdvancedApiKeyManager.revokeApiKey(params.keyId, params.tenantId, userId, String(body.reason ?? "Manual revocation"));
        return Response.json({ success: true });
      },
    },
  },
});