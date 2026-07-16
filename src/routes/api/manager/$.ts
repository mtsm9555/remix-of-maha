// Manager observability endpoints.
//   GET  /api/manager/:departmentId/status
//   GET  /api/manager/:departmentId/tasks
//   POST /api/manager/:departmentId/tasks/:taskId/review
import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function handle(request: Request, splat: string | undefined): Promise<Response> {
  const { ArchitectureRegistry } = await import("@/backend/os/ArchitectureRegistry");
  const { initializeMahaOS } = await import("@/backend/os/bootstrap");
  await initializeMahaOS();
  const parts = (splat ?? "").split("/").filter(Boolean);
  const method = request.method.toUpperCase();
  const [deptId, section, taskId, action] = parts;
  if (!deptId) return json({ error: "Missing department id" }, 400);

  if (section === "status" && method === "GET") {
    const report = ArchitectureRegistry.getOrgHealthReport();
    const d = report.departments.find((x) => x.id === deptId);
    if (!d) return json({ error: "Department not found" }, 404);
    return json({
      department: d.name,
      budget: d.budget,
      kpis: d.kpis,
      agentPool: d.managerMetrics,
    });
  }

  if (section === "tasks" && !taskId && method === "GET") {
    const manager = ArchitectureRegistry.getManager(deptId as any);
    if (!manager) return json({ error: "Department not initialized" }, 404);
    return json({
      department: deptId,
      metrics: manager.getTaskBoardMetrics(),
      tasks: manager.getTaskBoardDetails(),
    });
  }

  if (section === "tasks" && taskId && action === "review" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    console.log(`[Manager API] Human override: ${body?.decision} on task ${taskId} in ${deptId}`);
    return json({ success: true, message: `Task ${taskId} ${body?.decision} by human manager.` });
  }

  return json({ error: "Not found" }, 404);
}

export const Route = createFileRoute("/api/manager/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, (params as any)._splat),
      POST: async ({ request, params }) => handle(request, (params as any)._splat),
    },
  },
});