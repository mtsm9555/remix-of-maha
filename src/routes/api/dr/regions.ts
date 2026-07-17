import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dr/regions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tenantId = new URL(request.url).searchParams.get("tenantId");
        if (!tenantId) return new Response("tenantId required", { status: 400 });
        const { DRRegionManager } = await import(
          "@/backend/infrastructure/dr/DRRegionManager.server"
        );
        return Response.json(await DRRegionManager.getRegions(tenantId));
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          tenantId: string;
          regionName: string;
          databaseEndpoint: string;
          cacheEndpoint: string;
          storageEndpoint: string;
          apiEndpoint: string;
          isPrimary?: boolean;
          failoverPriority?: number;
        };
        const { DRRegionManager } = await import(
          "@/backend/infrastructure/dr/DRRegionManager.server"
        );
        const region = await DRRegionManager.registerRegion(body.tenantId, body.regionName, body);
        return Response.json(region, { status: 201 });
      },
    },
  },
});