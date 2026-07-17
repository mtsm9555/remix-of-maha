import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/user/memories/$memoryId")({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const { UserMemoryStore } = await import(
          "@/backend/data/user/UserMemoryStore.server"
        );
        const ok = await UserMemoryStore.deleteMemory(userId, params.memoryId);
        if (!ok) return Response.json({ error: "Not found or forbidden" }, { status: 404 });
        return Response.json({ success: true });
      },
    },
  },
});