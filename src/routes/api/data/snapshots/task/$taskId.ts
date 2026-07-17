import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/snapshots/task/$taskId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) {
          return new Response("Forbidden", { status: 403 });
        }

        const { ContextSnapshotter } = await import(
          "@/backend/data/snapshots/ContextSnapshotter.server"
        );
        const snapshots = await ContextSnapshotter.listByTask(params.taskId);
        return Response.json({ snapshots });
      },
    },
  },
});