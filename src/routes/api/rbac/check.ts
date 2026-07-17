import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rbac/check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { userId: string; tenantId: string; resource: string; action: string; workspaceId?: string; resourceId?: string };
        const { PermissionEngine } = await import("@/backend/security/rbac/PermissionEngine.server");
        const result = await PermissionEngine.check({
          userId: body.userId,
          tenantId: body.tenantId,
          workspaceId: body.workspaceId,
          resource: body.resource as any,
          action: body.action as any,
          resourceId: body.resourceId,
        });
        return Response.json(result);
      },
    },
  },
});