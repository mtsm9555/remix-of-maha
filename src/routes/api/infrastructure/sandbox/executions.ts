import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/sandbox/executions")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data, error } = await supabaseAdmin
          .from("sandbox_executions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ executions: data ?? [] });
      },
    },
  },
});