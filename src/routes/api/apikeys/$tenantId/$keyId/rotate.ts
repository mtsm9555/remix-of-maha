import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/apikeys/$tenantId/$keyId/rotate")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const { AdvancedApiKeyManager } = await import("@/backend/tenant/apikeys/AdvancedApiKeyManager.server");
        const result = await AdvancedApiKeyManager.rotateApiKey(params.keyId, params.tenantId, userId);
        return Response.json({ ...result, message: "New key generated. Old key has been revoked." });
      },
    },
  },
});