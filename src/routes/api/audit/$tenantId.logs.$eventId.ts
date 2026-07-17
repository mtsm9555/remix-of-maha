import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/audit/$tenantId/logs/$eventId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { AuditQueryEngine } = await import("@/backend/security/audit/AuditQueryEngine.server");
        const event = await AuditQueryEngine.getEvent(params.eventId, params.tenantId);
        if (!event) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
        return Response.json({ event });
      },
    },
  },
});
