import { createFileRoute } from "@tanstack/react-router";
import { AgentBudgetEngine } from "@/backend/os/budgeting/AgentBudgetEngine";
import type { Department } from "@/backend/agents/departments/types";

export const Route = createFileRoute("/api/budget/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as any)._splat ?? "";
        const parts = splat.split("/").filter(Boolean);

        if (parts[0] === "agent" && parts[1]) {
          const agentId = parts[1];
          const usage = await AgentBudgetEngine.getCurrentUsage(agentId);
          const config = AgentBudgetEngine.getConfig(agentId);
          const dailyLimit = config?.limits.daily.totalCostUSD ?? 0;
          return Response.json({
            agentId,
            currentUsage: usage,
            limits: config?.limits.daily ?? null,
            percentUsed: dailyLimit > 0 ? (usage.totalCostUSD / dailyLimit) * 100 : 0,
          });
        }

        if (parts[0] === "transactions") {
          const url = new URL((globalThis as any).location?.href ?? "http://localhost/");
          const limit = Number(url.searchParams.get("limit") ?? "50");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("budget_transactions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);
          if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
          return Response.json({ transactions: data });
        }

        return new Response("Not found", { status: 404 });
      },
      POST: async ({ params }) => {
        const splat = (params as any)._splat ?? "";
        const parts = splat.split("/").filter(Boolean);

        if (parts[0] === "agent" && parts[1] && parts[2] === "halt") {
          const agentId = parts[1];
          const zero = { llmTokens: 0, llmCostUSD: 0, toolExecutions: 0, toolCostUSD: 0, apiCalls: 0, apiCostUSD: 0, totalCostUSD: 0 };
          AgentBudgetEngine.configureAgent({
            agentId,
            department: "operations" as Department,
            limits: { hourly: zero, daily: zero, monthly: zero },
          });
          return Response.json({ success: true, message: `Agent ${agentId} budget halted.` });
        }

        return new Response("Not found", { status: 404 });
      },
    },
  },
});