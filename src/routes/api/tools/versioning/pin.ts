import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  agentId: z.string().min(1),
  toolName: z.string().min(1),
  version: z.string().min(1),
  reason: z.string().optional(),
});

export const Route = createFileRoute("/api/tools/versioning/pin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json());
        if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
        const { agentId, toolName, version, reason } = parsed.data;

        const { VersionRegistry } = await import(
          "@/backend/tools/versioning/VersionRegistry.server"
        );
        const rec = await VersionRegistry.getVersion(toolName, version);
        if (!rec) return Response.json({ error: "Version not found" }, { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("agent_tool_pins").upsert(
          {
            agent_id: agentId,
            tool_name: toolName,
            pinned_version: version,
            reason: reason ?? "Manual pin",
            pinned_at: new Date().toISOString(),
          },
          { onConflict: "agent_id,tool_name" },
        );
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ success: true });
      },
    },
  },
});