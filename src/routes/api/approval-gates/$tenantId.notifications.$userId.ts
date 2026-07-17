import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/notifications/$userId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") || "50");
        const { ApprovalNotificationService } = await import("@/backend/security/approval/ApprovalNotificationService.server");
        const notifications = await ApprovalNotificationService.getUserNotifications(params.userId, limit);
        return Response.json({ notifications });
      },
    },
  },
});