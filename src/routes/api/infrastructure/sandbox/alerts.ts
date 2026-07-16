import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/sandbox/alerts")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const since = new Date(Date.now() - 86_400_000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("sandbox_security_violations")
          .select("*")
          .gte("created_at", since)
          .order("created_at", { ascending: false });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ alerts: data ?? [] });
      },
    },
  },
});