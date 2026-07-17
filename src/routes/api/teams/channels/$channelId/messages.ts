import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/teams/channels/$channelId/messages")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? 50);
        const { TeamCollaborationEngine } = await import(
          "@/backend/tenant/teams/TeamCollaborationEngine.server"
        );
        return Response.json({
          messages: await TeamCollaborationEngine.getChannelMessages(params.channelId, limit),
        });
      },
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import("@/backend/data/user/routeAuth.server");
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });
        const body = (await request.json()) as {
          content?: string; senderName?: string;
          attachments?: string[]; mentions?: string[]; replyToId?: string;
        };
        if (!body.content) return Response.json({ error: "content required" }, { status: 400 });
        const { TeamCollaborationEngine } = await import(
          "@/backend/tenant/teams/TeamCollaborationEngine.server"
        );
        const message = await TeamCollaborationEngine.postMessage(
          params.channelId, userId, body.senderName ?? "user",
          body.content, body.attachments ?? [], body.mentions ?? [], body.replyToId,
        );
        return Response.json({ success: true, message });
      },
    },
  },
});
