import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/collaboration/sessions")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("collaboration_sessions")
          .select("*")
          .in("status", ["negotiating", "active"])
          .order("created_at", { ascending: false });
        return Response.json({ sessions: data ?? [] });
      },
    },
  },
});