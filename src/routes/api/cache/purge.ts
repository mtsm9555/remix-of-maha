import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cache/purge")({
  server: {
    handlers: {
      POST: async () => {
        const { MultiLevelCacheManager } = await import(
          "@/backend/infrastructure/cache/MultiLevelCacheManager.server"
        );
        return Response.json({ purged: await MultiLevelCacheManager.purgeExpired() });
      },
    },
  },
});