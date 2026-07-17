import { createFileRoute } from "@tanstack/react-router";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const Route = createFileRoute("/api/data/user/profile")({
  server: {
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: {
          middleware: [requireSupabaseAuth],
          handler: async ({ context }) => {
            const { UserMemoryStore } = await import(
              "@/backend/data/user/UserMemoryStore.server"
            );
            const profile = await UserMemoryStore.getUserProfile(context.userId);
            return Response.json({ profile });
          },
        },
        PUT: {
          middleware: [requireSupabaseAuth],
          handler: async ({ request, context }) => {
            const updates = await request.json().catch(() => ({}));
            const { UserMemoryStore } = await import(
              "@/backend/data/user/UserMemoryStore.server"
            );
            await UserMemoryStore.updatePreferences(context.userId, updates);
            return Response.json({ success: true });
          },
        },
      }),
  },
});