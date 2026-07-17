import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rbac/$tenantId/roles")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { RoleManager } = await import("@/backend/security/rbac/RoleManager.server");
        return Response.json({ roles: await RoleManager.listForTenant(params.tenantId) });
      },
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { name: string; permissions: string[]; description?: string; parentRoleId?: string; maxMembers?: number };
        const { RoleManager } = await import("@/backend/security/rbac/RoleManager.server");
        const role = await RoleManager.create(params.tenantId, body.name, body.permissions ?? [], {
          description: body.description,
          parentRoleId: body.parentRoleId,
          maxMembers: body.maxMembers,
        });
        return Response.json({ role });
      },
    },
  },
});