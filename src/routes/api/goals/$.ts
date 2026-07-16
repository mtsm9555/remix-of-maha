// Autonomous planning HTTP API.
//   POST /api/goals/execute   → run a goal end-to-end
//   GET  /api/goals           → list tracked goals
//   GET  /api/goals/:id       → goal status + progress
import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parseSplat(splat: string | undefined): string[] {
  return (splat ?? "").split("/").filter(Boolean);
}

async function handle(request: Request, splat: string | undefined): Promise<Response> {
  const { PlanningEngine } = await import("@/backend/planning/PlanningEngine");
  const method = request.method.toUpperCase();
  const parts = parseSplat(splat);

  if (parts.length === 0) {
    if (method !== "GET") return json({ error: `Method ${method} not allowed` }, 405);
    return json({ goals: PlanningEngine.getAllGoals() });
  }

  if (parts.length === 1 && parts[0] === "execute") {
    if (method !== "POST") return json({ error: `Method ${method} not allowed` }, 405);
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const goal = body?.goal;
    const userId = body?.userId ?? "anonymous";
    if (!goal || typeof goal !== "string") return json({ error: "Missing `goal` string" }, 400);
    try {
      const result = await PlanningEngine.executeGoal(goal, userId);
      return json({ success: true, goal: result.goal, plan: result.plan });
    } catch (e: any) {
      return json({ success: false, error: e?.message ?? String(e) }, 500);
    }
  }

  if (parts.length === 1) {
    if (method !== "GET") return json({ error: `Method ${method} not allowed` }, 405);
    const goal = PlanningEngine.getGoalStatus(parts[0]);
    if (!goal) return json({ error: "Goal not found" }, 404);
    return json({ goal, progress: PlanningEngine.getProgress(parts[0]) });
  }

  return json({ error: "Not found" }, 404);
}

export const Route = createFileRoute("/api/goals/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, (params as any)._splat),
      POST: async ({ request, params }) => handle(request, (params as any)._splat),
    },
  },
});