import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/user/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { UserMemoryStore } = await import("@/backend/data/user/UserMemoryStore.server");
        const profile = await UserMemoryStore.getUserProfile(userId);
        return Response.json({ profile });
      },
      PUT: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const updates = await request.json().catch(() => ({}));
        const { UserMemoryStore } = await import("@/backend/data/user/UserMemoryStore.server");
        await UserMemoryStore.updatePreferences(userId, updates);
        return Response.json({ success: true });
      },
    },
  },
});