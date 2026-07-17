import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/queue/tasks/$taskId/fail")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = (await request.json()) as { error?: string; errorCode?: string };
        if (!body?.error) return Response.json({ error: "error required" }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("orchestrated_tasks")
          .select("*")
          .eq("id", params.taskId)
          .maybeSingle();
        if (!row) return Response.json({ error: "not_found" }, { status: 404 });
        const r = row as any;
        const task = {
          id: r.id,
          queueId: r.queue_id,
          tenantId: r.tenant_id,
          type: r.type,
          payload: r.payload,
          priority: r.priority,
          state: r.state,
          attempts: r.attempts,
          maxAttempts: r.max_attempts,
          createdAt: new Date(r.created_at),
          timeoutMs: r.timeout_ms,
          retryStrategy: r.retry_strategy,
          retryDelayMs: r.retry_delay_ms,
          dependsOn: r.depends_on ?? [],
          metadata: r.metadata ?? {},
        } as any;
        const { RetryAndDeadLetterHandler } = await import(
          "@/backend/infrastructure/queue/RetryAndDeadLetterHandler.server"
        );
        const result = await RetryAndDeadLetterHandler.handleTaskFailure(task, body.error, body.errorCode);
        return Response.json(result);
      },
    },
  },
});