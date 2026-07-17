import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/governance/legal-hold")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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

        const body = (await request.json()) as {
          entityType?: string;
          entityIds?: string[];
          reason?: string;
        };
        if (!body.entityType || !body.entityIds?.length || !body.reason) {
          return Response.json(
            { error: "entityType, entityIds, and reason are required" },
            { status: 400 },
          );
        }

        const { RetentionManager } = await import(
          "@/backend/data/governance/RetentionManager.server"
        );
        await RetentionManager.placeLegalHold(
          body.entityType,
          body.entityIds,
          body.reason,
          userId,
        );
        return Response.json({ success: true });
      },
    },
  },
});