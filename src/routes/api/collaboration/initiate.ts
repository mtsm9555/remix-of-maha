import { createFileRoute } from "@tanstack/react-router";
import { CollaborationOrchestrator } from "@/backend/collaboration/CollaborationOrchestrator";
import type { Department } from "@/backend/agents/departments/types";

export const Route = createFileRoute("/api/collaboration/initiate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { initiatorId, initiatorDept, targetDept, objective, payload } =
          (await request.json()) as {
            initiatorId: string;
            initiatorDept: Department;
            targetDept: Department;
            objective: string;
            payload?: Record<string, unknown>;
          };
        if (!initiatorId || !initiatorDept || !targetDept || !objective) {
          return new Response(
            JSON.stringify({ error: "initiatorId, initiatorDept, targetDept, objective required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        const session = await CollaborationOrchestrator.initiateCollaboration(
          initiatorId,
          initiatorDept,
          targetDept,
          objective,
          payload ?? {},
        );
        return Response.json({ success: true, session });
      },
    },
  },
});