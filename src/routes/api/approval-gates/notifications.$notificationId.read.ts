import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/notifications/$notificationId/read")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { ApprovalNotificationService } = await import("@/backend/security/approval/ApprovalNotificationService.server");
        await ApprovalNotificationService.markAsRead(params.notificationId);
        return Response.json({ ok: true });
      },
    },
  },
});