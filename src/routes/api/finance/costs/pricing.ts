import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/finance/costs/pricing")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const model = (await request.json()) as {
          toolName?: string;
          modelType?: string;
        };
        if (!model?.toolName || !model?.modelType) {
          return Response.json(
            { error: "toolName and modelType required" },
            { status: 400 },
          );
        }
        const { PricingRegistry } = await import(
          "@/backend/tools/cost/PricingRegistry.server"
        );
        try {
          await PricingRegistry.updatePricingModel(model as never);
          return Response.json({ success: true });
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});