import { createFileRoute } from "@tanstack/react-router";
import { SystemDocumentationManager } from "@/backend/docs/system/DocumentationManager.server";
import type { DocFormat } from "@/backend/docs/system/SystemDocumentationTypes";

export const Route = createFileRoute("/api/system-docs/$tenantId/$docId/export")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const format = (url.searchParams.get("format") ?? "markdown") as DocFormat;
        try {
          const exp = await SystemDocumentationManager.exportDocumentation(params.docId, params.tenantId, format);
          const contentType =
            format === "html" ? "text/html" : format === "markdown" ? "text/markdown" : "text/plain";
          return new Response(exp.content, {
            headers: {
              "Content-Type": contentType,
              "Content-Disposition": `attachment; filename="${exp.filename}"`,
            },
          });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 404 });
        }
      },
    },
  },
});