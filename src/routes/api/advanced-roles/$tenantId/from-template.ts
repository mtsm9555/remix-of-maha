import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/advanced-roles/$tenantId/from-template")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isTenantAdmin } = await import("@/backend/tenant/roles/tenantRoleAuth.server");
        if (!(await isTenantAdmin(params.tenantId, userId)))
          return new Response("Forbidden", { status: 403 });
        const body = (await request.json().catch(() => ({}))) as {
          templateId?: string; customName?: string;
        };
        if (!body.templateId)
          return Response.json({ error: "templateId required" }, { status: 400 });
        const { RoleTemplateManager } = await import(
          "@/backend/tenant/roles/RoleTemplateManager.server"
        );
        const role = await RoleTemplateManager.createRoleFromTemplate(
          params.tenantId, body.templateId, body.customName, userId,
        );
        return Response.json({ success: true, role });
      },
    },
  },
});