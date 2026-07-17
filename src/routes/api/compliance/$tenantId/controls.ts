import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/compliance/$tenantId/controls")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { ComplianceFrameworkManager } = await import("@/backend/security/compliance/ComplianceFrameworkManager.server");
        const url = new URL(request.url);
        const framework = url.searchParams.get("framework") as any;
        return Response.json({ controls: await ComplianceFrameworkManager.listControls(params.tenantId, framework ?? undefined) });
      },
      POST: async ({ params, request }) => {
        const { ComplianceFrameworkManager } = await import("@/backend/security/compliance/ComplianceFrameworkManager.server");
        const { framework } = await request.json();
        const seeded = await ComplianceFrameworkManager.seedFrameworkControls(params.tenantId, framework);
        return Response.json({ seeded });
      },
      PATCH: async ({ request }) => {
        const { ComplianceFrameworkManager } = await import("@/backend/security/compliance/ComplianceFrameworkManager.server");
        const { controlId, status, assessedBy } = await request.json();
        await ComplianceFrameworkManager.updateControlStatus(controlId, status, assessedBy);
        return Response.json({ ok: true });
      },
    },
  },
});