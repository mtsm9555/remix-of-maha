import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rbac/permissions")({
  server: {
    handlers: {
      GET: async () => {
        const { PermissionRegistry } = await import("@/backend/security/rbac/PermissionRegistry.server");
        return Response.json({ permissions: await PermissionRegistry.getAll() });
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as { resource: string; action: string; description: string; isSystem?: boolean };
        const { PermissionRegistry } = await import("@/backend/security/rbac/PermissionRegistry.server");
        const perm = await PermissionRegistry.register(body.resource as any, body.action as any, body.description, body.isSystem);
        return Response.json({ permission: perm });
      },
    },
  },
});