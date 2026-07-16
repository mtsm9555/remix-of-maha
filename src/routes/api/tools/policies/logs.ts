import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/policies/logs")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data, error } = await supabaseAdmin
          .from("tool_policy_logs")
          .select("*")
          .order("evaluated_at", { ascending: false })
          .limit(100);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ logs: data ?? [] });
      },
    },
  },
});