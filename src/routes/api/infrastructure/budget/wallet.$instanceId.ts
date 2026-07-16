import { createFileRoute } from "@tanstack/react-router";
import { InstanceWalletManager } from "@/backend/infrastructure/budget/InstanceWalletManager";

export const Route = createFileRoute("/api/infrastructure/budget/wallet/$instanceId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const wallet = await InstanceWalletManager.getWallet(params.instanceId);
        if (!wallet) {
          return new Response(JSON.stringify({ error: "Wallet not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ wallet });
      },
    },
  },
});