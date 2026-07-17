import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/retrieval/overview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) {
          return new Response("Forbidden", { status: 403 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const cutoff = new Date(Date.now() - 86_400_000).toISOString();
        const { data } = await supabaseAdmin
          .from("retrieval_events" as any)
          .select(
            "source, latency_ms, tokens_consumed, estimated_cost_usd, avg_relevance_score",
          )
          .gte("timestamp", cutoff);

        const rows = (data ?? []) as any[];
        const totals = rows.reduce(
          (acc, r) => {
            acc.totalQueries++;
            acc.totalLatency += Number(r.latency_ms ?? 0);
            acc.totalTokens += Number(r.tokens_consumed ?? 0);
            acc.totalCost += Number(r.estimated_cost_usd ?? 0);
            acc.totalRelevance += Number(r.avg_relevance_score ?? 0);
            return acc;
          },
          {
            totalQueries: 0,
            totalLatency: 0,
            totalTokens: 0,
            totalCost: 0,
            totalRelevance: 0,
          },
        );
        const n = totals.totalQueries || 1;
        return Response.json({
          overview: totals,
          avgLatency: totals.totalLatency / n,
          avgRelevance: totals.totalRelevance / n,
        });
      },
    },
  },
});