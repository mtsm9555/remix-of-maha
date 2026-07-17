import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/approval-gates/$tenantId/requests/$requestId/execute")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { executedBy: string };
        const { ApprovalExecutionEngine } = await import("@/backend/security/approval/ApprovalExecutionEngine.server");
        const execution = await ApprovalExecutionEngine.executeApprovedRequest(params.requestId, body.executedBy);
        return Response.json({ execution });
      },
      GET: async ({ params }) => {
        const { ApprovalExecutionEngine } = await import("@/backend/security/approval/ApprovalExecutionEngine.server");
        const executions = await ApprovalExecutionEngine.getExecutionHistory(params.requestId);
        return Response.json({ executions });
      },
    },
  },
});