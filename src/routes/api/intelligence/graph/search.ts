import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/intelligence/graph/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get("query") ?? "";
        const depth = Number(url.searchParams.get("depth") ?? "2");
        if (!query) {
          return new Response(JSON.stringify({ error: "query required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("graph_edges")
          .select("*")
          .or(`source_name.eq.${query},target_name.eq.${query}`)
          .limit(50);
        return Response.json({ query, depth, edges: data ?? [] });
      },
    },
  },
});
