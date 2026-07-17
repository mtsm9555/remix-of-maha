import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/apikeys/$tenantId/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantMember } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantMember(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const { AdvancedApiKeyManager } = await import("@/backend/tenant/apikeys/AdvancedApiKeyManager.server");
        return Response.json({ keys: await AdvancedApiKeyManager.getApiKeys(params.tenantId) });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId))) return new Response("Forbidden", { status: 403 });
        const body = await request.json();
        const { AdvancedApiKeyManager } = await import("@/backend/tenant/apikeys/AdvancedApiKeyManager.server");
        const result = await AdvancedApiKeyManager.createApiKey(
          params.tenantId,
          String(body.name ?? "New API Key"),
          Array.isArray(body.scopes) ? body.scopes : ["read"],
          {
            description: body.description,
            allowedEndpoints: body.allowedEndpoints,
            allowedDepartments: body.allowedDepartments,
            rateLimitPerMinute: body.rateLimitPerMinute,
            rateLimitPerDay: body.rateLimitPerDay,
            ipAllowlist: body.ipAllowlist,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
            rotationPolicy: body.rotationPolicy,
            createdBy: userId,
          },
        );
        return Response.json({ ...result, message: "Store this key securely. It will not be shown again." });
      },
    },
  },
});