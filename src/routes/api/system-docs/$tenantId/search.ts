import { createFileRoute } from "@tanstack/react-router";
import { DocumentationSearchEngine } from "@/backend/docs/system/DocumentationSearchEngine.server";

export const Route = createFileRoute("/api/system-docs/$tenantId/search")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const results = await DocumentationSearchEngine.search(
          params.tenantId,
          url.searchParams.get("q") ?? "",
          {
            category: url.searchParams.get("category") ?? undefined,
            limit: Number(url.searchParams.get("limit") ?? 20),
          },
        );
        return Response.json({ results });
      },
    },
  },
});