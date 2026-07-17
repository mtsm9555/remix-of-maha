import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/governance/dsar/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as {
          requestType?: "access" | "deletion" | "portability" | "correction";
          scope?: { dataTypes?: string[] };
        };
        if (!body.requestType || !body.scope?.dataTypes) {
          return Response.json(
            { error: "requestType and scope.dataTypes are required" },
            { status: 400 },
          );
        }

        const { DSARHandler } = await import(
          "@/backend/data/governance/DSARHandler.server"
        );
        const created = await DSARHandler.createRequest(userId, body.requestType, {
          dataTypes: body.scope.dataTypes,
        });
        return Response.json({ success: true, request: created });
      },
    },
  },
});