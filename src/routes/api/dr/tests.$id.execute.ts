import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dr/tests/$id/execute")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { DRTestManager } = await import("@/backend/infrastructure/dr/DRTestManager.server");
        return Response.json(await DRTestManager.executeTest(params.id));
      },
    },
  },
});