import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/compliance/$tenantId/consent")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { ConsentManager } = await import("@/backend/security/compliance/ConsentManager.server");
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId") ?? undefined;
        return Response.json({ consents: await ConsentManager.listConsents(params.tenantId, userId) });
      },
      POST: async ({ params, request }) => {
        const { ConsentManager } = await import("@/backend/security/compliance/ConsentManager.server");
        const b = await request.json();
        const consent = await ConsentManager.recordConsent(params.tenantId, b.userId, b.purpose, b.granted, {
          ipAddress: b.ipAddress,
          userAgent: b.userAgent,
          consentText: b.consentText,
          expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined,
        });
        return Response.json({ consent });
      },
      DELETE: async ({ params, request }) => {
        const { ConsentManager } = await import("@/backend/security/compliance/ConsentManager.server");
        const { consentId, userId, withdrawnBy } = await request.json();
        await ConsentManager.withdrawConsent(consentId, params.tenantId, userId, withdrawnBy);
        return Response.json({ ok: true });
      },
    },
  },
});