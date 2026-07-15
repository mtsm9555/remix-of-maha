// src/lib/workflows.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const nodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["agent_task", "tool_call", "llm_prompt", "condition", "memory_save"]),
  config: z.record(z.any()).default({}),
});

const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
});

// ── Create ───────────────────────────────────────────────────────────
export const createWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional().default(""),
      nodes: z.array(nodeSchema).default([]),
      edges: z.array(edgeSchema).default([]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { data: row, error } = await supabase
      .from("workflow_definitions")
      .insert({
        user_id: context.userId,
        name: data.name,
        description: data.description,
        nodes_json: data.nodes,
        edges_json: data.edges,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ── List ─────────────────────────────────────────────────────────────
export const listWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as any;
    const { data, error } = await supabase
      .from("workflow_definitions")
      .select("id, name, description, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ── Get one ──────────────────────────────────────────────────────────
export const getWorkflow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { data: row, error } = await supabase
      .from("workflow_definitions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Workflow not found");
    return row;
  });

// ── Trigger ──────────────────────────────────────────────────────────
export const triggerWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      workflowId: z.string().uuid(),
      input: z.any().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Verify ownership via RLS-scoped client before running
    const supabase = context.supabase as any;
    const { data: def, error } = await supabase
      .from("workflow_definitions")
      .select("id")
      .eq("id", data.workflowId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!def) throw new Error("Workflow not found");

    const { WorkflowEngine } = await import("@/backend/workflows/WorkflowEngine");
    const result = await WorkflowEngine.trigger(data.workflowId, context.userId, data.input ?? {});
    return result;
  });

// ── Run status ───────────────────────────────────────────────────────
export const getWorkflowRun = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ runId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { data: row, error } = await supabase
      .from("workflow_runs")
      .select("*")
      .eq("id", data.runId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Run not found");
    return row;
  });

// ── List runs for a workflow ─────────────────────────────────────────
export const listWorkflowRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ workflowId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { data: rows, error } = await supabase
      .from("workflow_runs")
      .select("id, status, started_at, completed_at, error")
      .eq("workflow_id", data.workflowId)
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });