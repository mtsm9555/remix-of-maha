import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/health/alerts/critical")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("health_anomalies")
          .select("*")
          .eq("severity", "critical")
          .gte("detected_at", new Date(Date.now() - 3600000).toISOString())
          .order("detected_at", { ascending: false })
          .limit(20);
        return Response.json({ alerts: data ?? [] });
      },
    },
  },
});