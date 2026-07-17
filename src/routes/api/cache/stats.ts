import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cache/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get("tenantId");
        if (!tenantId) return new Response("tenantId required", { status: 400 });
        const { MultiLevelCacheManager } = await import(
          "@/backend/infrastructure/cache/MultiLevelCacheManager.server"
        );
        return Response.json(await MultiLevelCacheManager.getStats(tenantId));
      },
    },
  },
});