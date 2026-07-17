import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vault/rotate/tick")({
  server: {
    handlers: {
      POST: async () => {
        const { RotationEngine } = await import("@/backend/security/vault/RotationEngine.server");
        const rotated = await RotationEngine.rotateDueSecrets();
        return Response.json({ rotated });
      },
    },
  },
});