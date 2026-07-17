import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/apikeys/$tenantId/$keyId/")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const updates = await request.json();
        const { AdvancedApiKeyManager } = await import("@/backend/tenant/apikeys/AdvancedApiKeyManager.server");
        await AdvancedApiKeyManager.updateApiKey(params.keyId, params.tenantId, updates, userId);
        return Response.json({ success: true });
      },
    },
  },
});