import { createFileRoute } from "@tanstack/react-router";
import { PlannerAgent } from "@/backend/agents/PlannerAgent";

export const Route = createFileRoute("/api/planner-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { query?: string };
          const query = body.query ?? "Say hi in one short sentence.";
          const result = await PlannerAgent.handleQuery({ query });
          return Response.json({ ok: true, result });
        } catch (error: any) {
          return Response.json(
            { ok: false, error: error?.message ?? String(error) },
            { status: 500 },
          );
        }
      },
    },
  },
});