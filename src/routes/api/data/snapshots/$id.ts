import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/snapshots/$id")({
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
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        const snap = await ContextSnapshotter.getSnapshot(params.id);
        if (!snap) return Response.json({ error: "Not found" }, { status: 404 });
        if (snap.agentId !== userId && !(await isAdmin(userId))) {
          return new Response("Forbidden", { status: 403 });
        }
        return Response.json({ snapshot: snap });
      },
    },
  },
});