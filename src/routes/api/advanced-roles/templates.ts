import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/advanced-roles/templates")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { RoleTemplateManager } = await import(
          "@/backend/tenant/roles/RoleTemplateManager.server"
        );
        return Response.json({ templates: await RoleTemplateManager.getTemplates() });
      },
    },
  },
});