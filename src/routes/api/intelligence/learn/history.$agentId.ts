import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/intelligence/learn/history/$agentId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: cycles } = await (supabaseAdmin as any)
          .from("learning_cycles")
          .select("*")
          .eq("agent_id", params.agentId)
          .order("created_at", { ascending: false })
          .limit(20);
        const { data: versions } = await (supabaseAdmin as any)
          .from("agent_prompt_versions")
          .select("id, version_number, status, created_at")
          .eq("agent_id", params.agentId)
          .order("version_number", { ascending: false });
        return Response.json({ cycles: cycles ?? [], versions: versions ?? [] });
      },
    },
  },
});