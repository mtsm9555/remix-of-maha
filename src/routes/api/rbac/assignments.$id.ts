import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rbac/assignments/$id")({
  server: {
    handlers: {
      DELETE: async ({ params }) => {
        const { RoleAssignmentManager } = await import("@/backend/security/rbac/RoleAssignmentManager.server");
        await RoleAssignmentManager.revoke(params.id);
        return Response.json({ ok: true });
      },
    },
  },
});