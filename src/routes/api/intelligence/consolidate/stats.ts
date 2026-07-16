import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/intelligence/consolidate/stats")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("raw_memories" as any)
          .select("department, is_consolidated");
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        const stats: Record<string, { total: number; consolidated: number }> = {};
        for (const row of (data ?? []) as { department: string; is_consolidated: boolean }[]) {
          const s = (stats[row.department] ||= { total: 0, consolidated: 0 });
          s.total++;
          if (row.is_consolidated) s.consolidated++;
        }
        return Response.json({ stats });
      },
    },
  },
});
