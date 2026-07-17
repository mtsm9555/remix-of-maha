import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/governance/dsar/$id/process")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { isAdmin } = await import(
          "@/backend/data/shared/sharedAuth.server"
        );
        if (!(await isAdmin(userId))) {
          return new Response("Forbidden", { status: 403 });
        }

        const { DSARHandler } = await import(
          "@/backend/data/governance/DSARHandler.server"
        );
        try {
          const result = await DSARHandler.processRequest(params.id);
          return Response.json(result);
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Process failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});