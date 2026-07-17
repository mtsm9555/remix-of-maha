import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/scaling/evaluate-all")({
  server: {
    handlers: {
      POST: async () => {
        const { ScalingEngine } = await import("@/backend/infrastructure/scaling/ScalingEngine.server");
        const policies = await ScalingEngine.getActivePolicies();
        const events = [];
        for (const p of policies) {
          const ev = await ScalingEngine.evaluatePolicy(p);
          if (ev) events.push(ev);
        }
        return Response.json({ evaluated: policies.length, events });
      },
    },
  },
});