import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models/seed-defaults")({
  server: {
    handlers: {
      POST: async () => {
        const { ModelRegistry } = await import("@/backend/infrastructure/models/ModelRegistry.server");
        await ModelRegistry.seedDefaultModels();
        return Response.json({ ok: true });
      },
    },
  },
});