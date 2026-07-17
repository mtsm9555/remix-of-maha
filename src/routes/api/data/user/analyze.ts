import { createFileRoute } from "@tanstack/react-router";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const Route = createFileRoute("/api/data/user/analyze")({
  server: {
    middleware: [requireSupabaseAuth],
    handlers: {
      POST: async ({ request, context }) => {
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
          context.userId,
          userMessage,
          agentResponse,
          body?.context ?? {},
        );
        return Response.json({ success: true, memoriesStored });
      },
    },
  },
});