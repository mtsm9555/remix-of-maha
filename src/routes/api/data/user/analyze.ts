import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/user/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = await request.json().catch(() => ({}));
        const userMessage = typeof body?.userMessage === "string" ? body.userMessage : "";
        const agentResponse = typeof body?.agentResponse === "string" ? body.agentResponse : "";
        if (!userMessage || !agentResponse) {
          return Response.json({ error: "userMessage and agentResponse required" }, { status: 400 });
        }
        const { UserInteractionAnalyzer } = await import(
          "@/backend/data/user/UserInteractionAnalyzer.server"
        );
        const memoriesStored = await UserInteractionAnalyzer.analyzeInteraction(
          userId,
          userMessage,
          agentResponse,
          body?.context ?? {},
        );
        return Response.json({ success: true, memoriesStored });
      },
    },
  },
});