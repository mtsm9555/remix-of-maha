import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cache/invalidate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as { tenantId: string; key?: string; tag?: string };
        if (!body.tenantId) return new Response("tenantId required", { status: 400 });
        const { MultiLevelCacheManager } = await import(
          "@/backend/infrastructure/cache/MultiLevelCacheManager.server"
        );
        let removed = 0;
        if (body.key) removed += await MultiLevelCacheManager.invalidate(body.tenantId, body.key);
        if (body.tag) removed += await MultiLevelCacheManager.invalidateByTag(body.tenantId, body.tag);
        return Response.json({ removed });
      },
    },
  },
});