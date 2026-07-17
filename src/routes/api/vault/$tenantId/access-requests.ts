import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vault/$tenantId/access-requests")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { secretId: string; userId: string; reason: string; requestedDuration?: number };
        const ip = request.headers.get('x-forwarded-for') ?? undefined;
        const ua = request.headers.get('user-agent') ?? undefined;
        const { SecretAccessController } = await import("@/backend/security/vault/SecretAccessController.server");
        const id = await SecretAccessController.requestAccess(body.secretId, params.tenantId, body.userId, body.reason, body.requestedDuration, ip, ua);
        return Response.json({ id });
      },
    },
  },
});