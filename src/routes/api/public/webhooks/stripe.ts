import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });
        const payload = await request.text();
        const { StripeClient } = await import("@/backend/billing/StripeClient.server");
        const { StripeWebhookHandler } = await import(
          "@/backend/billing/StripeWebhookHandler.server"
        );
        let event;
        try {
          event = StripeClient.constructWebhookEvent(payload, signature);
        } catch (e: any) {
          return new Response(`Invalid signature: ${e.message}`, { status: 401 });
        }
        try {
          await StripeWebhookHandler.handle(event);
        } catch (e: any) {
          return new Response(`Handler error: ${e.message}`, { status: 500 });
        }
        return Response.json({ received: true });
      },
    },
  },
});