import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/api/data/shared/promotions/$promotionId/approve",
)({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) {
          return new Response("Forbidden", { status: 403 });
        }

        const { SharedMemoryStore } = await import(
          "@/backend/data/shared/SharedMemoryStore.server"
        );
        const sharedMemory = await SharedMemoryStore.approvePromotion(
          params.promotionId,
          userId,
        );
        return Response.json({ success: true, sharedMemory });
      },
    },
  },
});