import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/org/$tenantId/api-keys")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { PermissionEngine } = await import("@/backend/tenant/organization/PermissionEngine.server");
        try {
          await PermissionEngine.enforcePermission(params.tenantId, userId, "api:keys:manage");
        } catch {
          return new Response("Forbidden", { status: 403 });
        }
        const { ApiKeyManager } = await import("@/backend/tenant/organization/ApiKeyManager.server");
        return Response.json({ keys: await ApiKeyManager.getApiKeys(params.tenantId) });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { PermissionEngine } = await import("@/backend/tenant/organization/PermissionEngine.server");
        try {
          await PermissionEngine.enforcePermission(params.tenantId, userId, "api:keys:manage");
        } catch {
          return new Response("Forbidden", { status: 403 });
        }
        const body = (await request.json()) as {
          name?: string; permissions?: string[]; rateLimitPerMinute?: number; expiresAt?: string;
        };
        if (!body.name || !body.permissions) {
          return Response.json({ error: "name and permissions required" }, { status: 400 });
        }
        const { ApiKeyManager } = await import("@/backend/tenant/organization/ApiKeyManager.server");
        const { apiKey, plaintextKey } = await ApiKeyManager.createApiKey(
          params.tenantId, body.name, body.permissions as never,
          body.rateLimitPerMinute ?? 60, userId,
          body.expiresAt ? new Date(body.expiresAt) : undefined,
        );
        return Response.json({ success: true, apiKey, plaintextKey });
      },
    },
  },
});
