import { createFileRoute } from "@tanstack/react-router";
import { ApprovalBridge } from "@/backend/os/approvals/ApprovalBridge";

export const Route = createFileRoute("/api/approvals/$")({
  server: {
    handlers: {
      GET: async () => {
        const pending = ApprovalBridge.listPending().map((p) => ({
          id: p.id,
          context: p.context,
          reason: (p.request as any).reason || "Action requires human oversight",
          timestamp: p.timestamp,
        }));
        return new Response(JSON.stringify({ pending }), {
          headers: { "content-type": "application/json" },
        });
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as { approvalId: string; decision: "approved" | "rejected" };
        if (!body?.approvalId || !body?.decision) {
          return new Response(JSON.stringify({ error: "invalid payload" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        ApprovalBridge.resolveApproval(body.approvalId, body.decision === "approved");
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});