import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tenants/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { TenantStore } = await import("@/backend/tenant/TenantStore.server");
        const tenants = await TenantStore.getUserTenants(userId);
        return Response.json({ tenants });
      },
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = (await request.json()) as { name?: string; slug?: string };
        if (!body.name || !body.slug) {
          return Response.json({ error: "name and slug are required" }, { status: 400 });
        }
        try {
          const { TenantStore } = await import("@/backend/tenant/TenantStore.server");
          const tenant = await TenantStore.createTenant(body.name, body.slug, userId);
          return Response.json({ success: true, tenant });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Create failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});