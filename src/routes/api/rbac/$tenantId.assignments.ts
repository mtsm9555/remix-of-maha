import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rbac/$tenantId/assignments")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        const roleId = url.searchParams.get("roleId");
        const { RoleAssignmentManager } = await import("@/backend/security/rbac/RoleAssignmentManager.server");
        if (userId) return Response.json({ assignments: await RoleAssignmentManager.listForUser(userId, params.tenantId) });
        if (roleId) return Response.json({ assignments: await RoleAssignmentManager.listForRole(roleId) });
        return new Response("userId or roleId required", { status: 400 });
      },
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { userId: string; roleId: string; assignedBy: string; workspaceId?: string; expiresAt?: string; metadata?: Record<string, unknown> };
        const { RoleAssignmentManager } = await import("@/backend/security/rbac/RoleAssignmentManager.server");
        const assignment = await RoleAssignmentManager.assign(body.userId, body.roleId, params.tenantId, body.assignedBy, {
          workspaceId: body.workspaceId,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
          metadata: body.metadata,
        });
        return Response.json({ assignment });
      },
    },
  },
});