import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tools/policies/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const context = (await request.json()) as Parameters<
          typeof import("@/backend/tools/policy/ToolPolicyEvaluator.server").ToolPolicyEvaluator.evaluate
        >[0];
        const { ToolPolicyEvaluator } = await import(
          "@/backend/tools/policy/ToolPolicyEvaluator.server"
        );
        const decision = await ToolPolicyEvaluator.evaluate(context);
        return Response.json({ decision });
      },
    },
  },
});