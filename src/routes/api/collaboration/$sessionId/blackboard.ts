import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/collaboration/$sessionId/blackboard")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("blackboard_artifacts")
          .select("*")
          .eq("collaboration_id", params.sessionId)
          .order("updated_at", { ascending: false });
        return Response.json({ artifacts: data ?? [] });
      },
    },
  },
});