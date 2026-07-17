import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/compliance/$tenantId/residency")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { DataResidencyManager } = await import("@/backend/security/compliance/DataResidencyManager.server");
        return Response.json({ policies: await DataResidencyManager.listPolicies(params.tenantId) });
      },
      POST: async ({ params, request }) => {
        const { DataResidencyManager } = await import("@/backend/security/compliance/DataResidencyManager.server");
        const b = await request.json();
        const policy = await DataResidencyManager.createPolicy(params.tenantId, b.name, b.requirement, b.options ?? {});
        return Response.json({ policy });
      },
      PUT: async ({ params, request }) => {
        const { DataResidencyManager } = await import("@/backend/security/compliance/DataResidencyManager.server");
        const { dataLocation } = await request.json();
        return Response.json(await DataResidencyManager.validateDataLocation(params.tenantId, dataLocation));
      },
    },
  },
});