import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rbac/roles/$roleId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { RoleManager } = await import("@/backend/security/rbac/RoleManager.server");
        const role = await RoleManager.get(params.roleId);
        return role ? Response.json({ role }) : new Response("Not found", { status: 404 });
      },
      PATCH: async ({ params, request }) => {
        const updates = (await request.json()) as Record<string, unknown>;
        const { RoleManager } = await import("@/backend/security/rbac/RoleManager.server");
        return Response.json({ role: await RoleManager.update(params.roleId, updates as any) });
      },
      DELETE: async ({ params }) => {
        const { RoleManager } = await import("@/backend/security/rbac/RoleManager.server");
        await RoleManager.remove(params.roleId);
        return Response.json({ ok: true });
      },
    },
  },
});