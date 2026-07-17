import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/alerts/$alertId/resolve")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json().catch(() => ({}))) as { userId?: string };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("audit_alerts").update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: body.userId ?? null,
        } as never).eq("id", params.alertId).eq("tenant_id", params.tenantId);
        return Response.json({ success: true });
      },
    },
  },
});
