import { createFileRoute } from "@tanstack/react-router";
import { CollaborationOrchestrator } from "@/backend/collaboration/CollaborationOrchestrator";

export const Route = createFileRoute("/api/collaboration/$sessionId/proposal")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { agentId, estimatedTimeMin, estimatedCostUSD, approach } =
          (await request.json()) as {
            agentId: string;
            estimatedTimeMin: number;
            estimatedCostUSD: number;
            approach: string;
          };
        if (!agentId) {
          return new Response(JSON.stringify({ error: "agentId required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        await CollaborationOrchestrator.handleProposal(params.sessionId, agentId, {
          estimatedTimeMin,
          estimatedCostUSD,
          approach,
        });
        return Response.json({ success: true, message: "Proposal submitted." });
      },
    },
  },
});