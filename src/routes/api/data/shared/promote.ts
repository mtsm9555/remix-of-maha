import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/shared/promote")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = await request.json().catch(() => ({}));
        const sourceMemoryId =
          typeof body?.sourceMemoryId === "string" ? body.sourceMemoryId : "";
        const content = typeof body?.content === "string" ? body.content : "";
        const sourceDepartment =
          typeof body?.sourceDepartment === "string" ? body.sourceDepartment : "";
        if (!content || !sourceDepartment) {
          return Response.json(
            { error: "content and sourceDepartment required" },
            { status: 400 },
          );
        }

        const { MemoryPromotionEngine } = await import(
          "@/backend/data/shared/MemoryPromotionEngine.server"
        );
        const evaluation = await MemoryPromotionEngine.evaluateForPromotion(
          sourceMemoryId,
          content,
          sourceDepartment,
          userId,
        );
        return Response.json({
          success: true,
          evaluation,
          message: evaluation.promoted
            ? "Promotion request created for human review."
            : "Memory deemed department-specific.",
        });
      },
    },
  },
});