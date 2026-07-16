import { createFileRoute } from "@tanstack/react-router";
import { ReputationEventProcessor } from "@/backend/infrastructure/reputation/ReputationEventProcessor";
import type { RawReputationEventInput } from "@/backend/infrastructure/reputation/ReputationTypes";

export const Route = createFileRoute("/api/infrastructure/reputation/event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as RawReputationEventInput;
        if (!body?.agentId || !body?.type || !body?.severity) {
          return new Response(JSON.stringify({ error: "agentId, type, severity required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const newScore = await ReputationEventProcessor.processEvent(body);
        return Response.json({ success: true, newScore });
      },
    },
  },
});