import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infrastructure/budget/ledger/$instanceId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("micro_transaction_ledger")
          .select("*")
          .eq("instance_id", params.instanceId)
          .order("timestamp", { ascending: false })
          .limit(50);
        return Response.json({ ledger: data ?? [] });
      },
    },
  },
});