import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dr/regions/$id/health")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { DRRegionManager } = await import(
          "@/backend/infrastructure/dr/DRRegionManager.server"
        );
        return Response.json(await DRRegionManager.performHealthCheck(params.id));
      },
    },
  },
});