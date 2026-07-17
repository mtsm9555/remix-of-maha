import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/versions/rollback")({
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
          entityId?: string;
          entityType?: string;
          targetVersionNumber?: number;
          reason?: string;
        };
        if (!body.entityId || !body.entityType || !body.targetVersionNumber) {
          return Response.json(
            {
              error:
                "entityId, entityType, and targetVersionNumber are required",
            },
            { status: 400 },
          );
        }

        const { KnowledgeRollbackEngine } = await import(
          "@/backend/data/versioning/KnowledgeRollbackEngine.server"
        );
        const result = await KnowledgeRollbackEngine.rollbackToVersion(
          body.entityId,
          body.entityType as never,
          body.targetVersionNumber,
          userId,
          body.reason ?? "Manual rollback by admin",
        );

        if (!result.success) {
          return Response.json({ error: result.reason }, { status: 400 });
        }
        return Response.json({ success: true, result });
      },
    },
  },
});