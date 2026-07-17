import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/governance/retention/enforce")({
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

        const { RetentionManager } = await import(
          "@/backend/data/governance/RetentionManager.server"
        );
        await RetentionManager.enforceRetentionPolicies();
        return Response.json({
          success: true,
          message: "Retention policies enforced",
        });
      },
    },
  },
});