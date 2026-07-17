import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/governance/audit-logs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
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

        const url = new URL(request.url);
        const eventType = url.searchParams.get("eventType") ?? undefined;
        const userIdFilter = url.searchParams.get("userId") ?? undefined;
        const limit = Number(url.searchParams.get("limit") ?? 100);

        const { ComplianceAuditLogger } = await import(
          "@/backend/data/governance/ComplianceAuditLogger.server"
        );
        const logs = await ComplianceAuditLogger.queryLogs({
          eventType,
          userId: userIdFilter,
          limit,
        });
        return Response.json({ logs });
      },
    },
  },
});