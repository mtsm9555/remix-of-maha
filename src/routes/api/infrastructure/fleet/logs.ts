import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/fleet/logs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const instanceId = url.searchParams.get("instanceId");
        const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 500);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let query = (supabaseAdmin as any)
          .from("agent_lifecycle_logs")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(limit);
        if (instanceId) query = query.eq("instance_id", instanceId);
        const { data, error } = await query;
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ logs: data ?? [] });
      },
    },
  },
});