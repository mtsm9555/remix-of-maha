import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/budget/topups/pending")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("budget_topup_requests")
          .select("*")
          .eq("status", "pending")
          .order("requested_at", { ascending: false });
        return Response.json({ requests: data ?? [] });
      },
    },
  },
});