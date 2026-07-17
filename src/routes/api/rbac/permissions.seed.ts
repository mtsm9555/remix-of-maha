import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rbac/permissions/seed")({
  server: {
    handlers: {
      POST: async () => {
        const { PermissionRegistry } = await import("@/backend/security/rbac/PermissionRegistry.server");
        await PermissionRegistry.seedDefaults();
        return Response.json({ ok: true });
      },
    },
  },
});