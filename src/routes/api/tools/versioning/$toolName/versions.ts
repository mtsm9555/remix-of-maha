import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/versioning/$toolName/versions")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("tool_versions")
          .select("version, status, published_at, changelog")
          .eq("tool_name", params.toolName)
          .order("published_at", { ascending: false });
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ toolName: params.toolName, versions: data ?? [] });
      },
    },
  },
});