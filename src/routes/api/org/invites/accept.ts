import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/org/invites/accept")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = (await request.json()) as { token?: string };
        if (!body.token) return Response.json({ error: "token required" }, { status: 400 });
        try {
          const { MemberManager } = await import("@/backend/tenant/organization/MemberManager.server");
          const member = await MemberManager.acceptInvite(body.token, userId);
          return Response.json({ success: true, member });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Accept failed" }, { status: 400 });
        }
      },
    },
  },
});
