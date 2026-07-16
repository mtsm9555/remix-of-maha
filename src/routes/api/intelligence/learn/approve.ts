import { createFileRoute } from "@tanstack/react-router";
import { PromptVersionControl } from "@/backend/intelligence/learning/PromptVersionControl";

export const Route = createFileRoute("/api/intelligence/learn/approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { agentId, versionId } = (await request.json()) as {
          agentId: string;
          versionId: string;
        };
        if (!agentId || !versionId) {
          return new Response(JSON.stringify({ error: "agentId and versionId required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        await PromptVersionControl.promoteToStable(agentId, versionId);
        return Response.json({ success: true, message: "Prompt promoted to stable." });
      },
    },
  },
});