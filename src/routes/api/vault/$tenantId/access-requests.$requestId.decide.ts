import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vault/$tenantId/access-requests/$requestId/decide")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { approverId: string; decision: 'approve' | 'reject'; rejectionReason?: string };
        const { SecretAccessController } = await import("@/backend/security/vault/SecretAccessController.server");
        if (body.decision === 'approve') {
          await SecretAccessController.approveRequest(params.requestId, body.approverId, params.tenantId);
        } else {
          await SecretAccessController.rejectRequest(params.requestId, body.approverId, params.tenantId, body.rejectionReason ?? 'Rejected');
        }
        return Response.json({ success: true });
      },
    },
  },
});