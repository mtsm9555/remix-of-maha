// Departments HTTP API.
//   GET  /api/departments                       → list departments
//   GET  /api/departments/:name/agents          → list agents in a department
//   GET  /api/departments/agents/status         → status of all agents
//   POST /api/departments/agents/:id/task       → assign task to an agent
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
  const { globalDepartmentRegistry } = await import(
    "@/backend/agents/departments/DepartmentRegistry"
  );
  const method = request.method.toUpperCase();
  const parts = parseSplat(splat);

  if (parts.length === 0) {
    if (method !== "GET") return json({ error: `Method ${method} not allowed` }, 405);
    return json({ departments: globalDepartmentRegistry.getAllDepartments() });
  }

  if (parts[0] === "agents" && parts[1] === "status" && parts.length === 2) {
    if (method !== "GET") return json({ error: `Method ${method} not allowed` }, 405);
    return json({ agents: globalDepartmentRegistry.getAllAgentStatus() });
  }

  if (parts[0] === "agents" && parts.length === 3 && parts[2] === "task") {
    if (method !== "POST") return json({ error: `Method ${method} not allowed` }, 405);
    const agent = globalDepartmentRegistry.getAgent(parts[1]);
    if (!agent) return json({ error: "Agent not found" }, 404);
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const { task, context } = body ?? {};
    if (!task || typeof task !== "string") return json({ error: "Missing `task` string" }, 400);
    try {
      const result = await agent.executeTask(task, context ?? {});
      return json({ success: true, agent: agent.getStatus(), result });
    } catch (e: any) {
      return json({ success: false, error: e?.message ?? String(e) }, 500);
    }
  }

  if (parts.length === 2 && parts[1] === "agents") {
    if (method !== "GET") return json({ error: `Method ${method} not allowed` }, 405);
    const agents = globalDepartmentRegistry.getDepartmentAgents(parts[0] as any);
    return json({ department: parts[0], agents: agents.map((a) => a.getStatus()) });
  }

  return json({ error: "Not found" }, 404);
}

export const Route = createFileRoute("/api/departments/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, (params as any)._splat),
      POST: async ({ request, params }) => handle(request, (params as any)._splat),
    },
  },
});