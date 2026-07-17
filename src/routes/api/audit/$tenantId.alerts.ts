import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/alerts")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        const limit = Number(url.searchParams.get("limit") ?? 50);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let q = supabaseAdmin.from("audit_alerts").select("*").eq("tenant_id", params.tenantId)
          .order("created_at", { ascending: false }).limit(limit);
        if (status) q = q.eq("status", status);
        const { data } = await q;
        return Response.json({ alerts: data ?? [] });
      },
    },
  },
});
