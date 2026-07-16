import { createFileRoute } from "@tanstack/react-router";
import { BudgetThrottler } from "@/backend/infrastructure/budget/BudgetThrottler";

export const Route = createFileRoute("/api/infrastructure/budget/topups/$requestId/approve")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("budget_topup_requests")
          .update({ status: "approved", processed_at: new Date().toISOString() })
          .eq("id", params.requestId);
        await BudgetThrottler.processApprovedTopUp(params.requestId);
        return Response.json({ success: true, message: "Top-up approved and applied." });
      },
    },
  },
});