import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/compliance/$tenantId/evidence")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { EvidenceCollector } = await import("@/backend/security/compliance/EvidenceCollector.server");
        const url = new URL(request.url);
        const controlId = url.searchParams.get("controlId") ?? undefined;
        return Response.json({ evidence: await EvidenceCollector.listEvidence(params.tenantId, controlId) });
      },
      POST: async ({ params, request }) => {
        const { EvidenceCollector } = await import("@/backend/security/compliance/EvidenceCollector.server");
        const b = await request.json();
        if (b.mode === "automated") {
          const ev = await EvidenceCollector.collectAutomatedEvidence(params.tenantId, b.controlId, b.controlName);
          return Response.json({ evidence: ev });
        }
        const ev = await EvidenceCollector.recordManualEvidence({ tenantId: params.tenantId, ...b });
        return Response.json({ evidence: ev });
      },
    },
  },
});