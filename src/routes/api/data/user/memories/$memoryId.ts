import { createFileRoute } from "@tanstack/react-router";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const Route = createFileRoute("/api/data/user/memories/$memoryId")({
  server: {
    middleware: [requireSupabaseAuth],
    handlers: {
      DELETE: async ({ params, context }) => {
        const { UserMemoryStore } = await import(
          "@/backend/data/user/UserMemoryStore.server"
        );
        const ok = await UserMemoryStore.deleteMemory(context.userId, params.memoryId);
        if (!ok) return Response.json({ error: "Not found or forbidden" }, { status: 404 });
        return Response.json({ success: true });
      },
    },
  },
});