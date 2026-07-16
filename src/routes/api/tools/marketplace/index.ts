import { createFileRoute } from "@tanstack/react-router";
import type { MarketplaceCategory } from "@/backend/tools/marketplace/MarketplaceTypes";

export const Route = createFileRoute("/api/tools/marketplace/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q") ?? "";
        const category = (url.searchParams.get("category") ?? undefined) as
          | MarketplaceCategory
          | undefined;
        const { MarketplaceStore } = await import("@/backend/tools/marketplace/MarketplaceStore.server");
        const listings = await MarketplaceStore.searchTools(q, category);
        return Response.json({ listings });
      },
    },
  },
});