import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/billing/plans")({
  server: {
    handlers: {
      GET: async () => {
        const { SubscriptionManager } = await import(
          "@/backend/billing/SubscriptionManager.server"
        );
        return Response.json({ plans: await SubscriptionManager.getAllPlans() });
      },
    },
  },
});