import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/snapshots/duplicates/$hash")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { ContextSnapshotter } = await import(
          "@/backend/data/snapshots/ContextSnapshotter.server"
        );
        const snapshot = await ContextSnapshotter.findDuplicatePrompt(params.hash);
        return Response.json({ isDuplicate: !!snapshot, snapshot });
      },
    },
  },
});