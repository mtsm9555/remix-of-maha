import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/retrieval/evaluate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = await request.json().catch(() => ({}));
        const eventId = typeof body?.eventId === "string" ? body.eventId : "";
        const originalQuery =
          typeof body?.originalQuery === "string" ? body.originalQuery : "";
        const fetchedMemoriesText =
          typeof body?.fetchedMemoriesText === "string"
            ? body.fetchedMemoriesText
            : "";
        const finalAgentOutput =
          typeof body?.finalAgentOutput === "string" ? body.finalAgentOutput : "";
        if (!eventId || !originalQuery || !finalAgentOutput) {
          return Response.json(
            {
              error:
                "eventId, originalQuery, and finalAgentOutput required",
            },
            { status: 400 },
          );
        }

        const { RetrievalRelevanceEvaluator } = await import(
          "@/backend/data/analytics/RetrievalRelevanceEvaluator.server"
        );
        const score = await RetrievalRelevanceEvaluator.evaluateRelevance(
          eventId,
          originalQuery,
          fetchedMemoriesText,
          finalAgentOutput,
        );
        return Response.json({ score });
      },
    },
  },
});