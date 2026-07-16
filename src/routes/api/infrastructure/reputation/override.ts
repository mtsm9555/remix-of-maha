import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/reputation/override")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { agentId, newScore, reason } = (await request.json()) as {
          agentId: string;
          newScore: number;
          reason?: string;
        };
        if (!agentId || typeof newScore !== "number") {
          return new Response(JSON.stringify({ error: "agentId and newScore required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        await supabaseAdmin
          .from("agent_reputation_scores")
          .update({ composite_score: newScore, updated_at: new Date().toISOString() })
          .eq("agent_id", agentId);
        console.log(`[reputation] override ${agentId} -> ${newScore}. Reason: ${reason ?? "n/a"}`);
        return Response.json({ success: true });
      },
    },
  },
});