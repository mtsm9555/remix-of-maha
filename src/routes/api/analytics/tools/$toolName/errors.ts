import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/tools/$toolName/errors")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const hours = Number(url.searchParams.get("hours") || 24);
        const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("tool_execution_events")
          .select("error_code")
          .eq("tool_name", params.toolName)
          .eq("success", false)
          .gte("timestamp", cutoff);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        const errorCounts: Record<string, number> = {};
        for (const row of data ?? []) {
          const code = (row.error_code as string | null) || "UNKNOWN";
          errorCounts[code] = (errorCounts[code] || 0) + 1;
        }
        return Response.json({ toolName: params.toolName, errorCounts });
      },
    },
  },
});