// REST endpoints for workflows.
//   GET    /api/workflows                 → list workflows
//   POST   /api/workflows                 → create workflow
//   GET    /api/workflows/:id             → get workflow definition
//   POST   /api/workflows/:id/trigger     → trigger a run
//   GET    /api/workflows/:id/runs        → list recent runs for a workflow
//   GET    /api/workflows/runs/:runId     → get one run's status
//
// Auth: requires "Authorization: Bearer <supabase-access-token>". All reads
// and writes go through an RLS-scoped client acting as that user.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function isNewSupabaseApiKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}

function makeUserClient(accessToken: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (isNewSupabaseApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type AuthOk = { ok: true; supabase: any; userId: string };
type AuthErr = { ok: false; response: Response };
async function requireUser(request: Request): Promise<AuthOk | AuthErr> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return { ok: false, response: json({ error: "Missing bearer token" }, 401) };
  const supabase = makeUserClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { ok: false, response: json({ error: "Invalid or expired token" }, 401) };
  return { ok: true, supabase, userId: data.user.id };
}

const nodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["agent_task", "tool_call", "llm_prompt", "condition", "memory_save"]),
  config: z.record(z.any()).default({}),
});
const edgeSchema = z.object({ source: z.string(), target: z.string() });
const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  nodes: z.array(nodeSchema).default([]),
  edges: z.array(edgeSchema).default([]),
});

function parseSplat(splat: string | undefined): string[] {
  return (splat ?? "").split("/").filter(Boolean);
}

async function handle(request: Request, splat: string | undefined): Promise<Response> {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;
  const method = request.method.toUpperCase();
  const parts = parseSplat(splat);

  // /api/workflows
  if (parts.length === 0) {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("workflow_definitions")
        .select("id, name, description, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ workflows: data ?? [] });
    }
    if (method === "POST") {
      let body: unknown;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Invalid payload", details: parsed.error.flatten() }, 400);
      const { data, error } = await supabase
        .from("workflow_definitions")
        .insert({
          user_id: userId,
          name: parsed.data.name,
          description: parsed.data.description,
          nodes_json: parsed.data.nodes,
          edges_json: parsed.data.edges,
        })
        .select("*")
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ workflow: data }, 201);
    }
    return json({ error: `Method ${method} not allowed` }, 405);
  }

  // /api/workflows/runs/:runId
  if (parts[0] === "runs" && parts.length === 2) {
    if (method !== "GET") return json({ error: `Method ${method} not allowed` }, 405);
    const runId = parts[1];
    if (!z.string().uuid().safeParse(runId).success) return json({ error: "Invalid run id" }, 400);
    const { data, error } = await supabase
      .from("workflow_runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Run not found" }, 404);
    return json({ run: data });
  }

  // /api/workflows/:id[...]
  const workflowId = parts[0];
  if (!z.string().uuid().safeParse(workflowId).success) return json({ error: "Invalid workflow id" }, 400);
  const tail = parts.slice(1);

  // /api/workflows/:id
  if (tail.length === 0) {
    if (method !== "GET") return json({ error: `Method ${method} not allowed` }, 405);
    const { data, error } = await supabase
      .from("workflow_definitions").select("*").eq("id", workflowId).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Workflow not found" }, 404);
    return json({ workflow: data });
  }

  // /api/workflows/:id/trigger
  if (tail.length === 1 && tail[0] === "trigger") {
    if (method !== "POST") return json({ error: `Method ${method} not allowed` }, 405);
    // Verify ownership via RLS before running (WorkflowEngine uses admin client)
    const { data: def, error: defErr } = await supabase
      .from("workflow_definitions").select("id").eq("id", workflowId).maybeSingle();
    if (defErr) return json({ error: defErr.message }, 500);
    if (!def) return json({ error: "Workflow not found" }, 404);

    let input: unknown = {};
    if (request.headers.get("content-length") && request.headers.get("content-length") !== "0") {
      try { input = (await request.json()) ?? {}; } catch { return json({ error: "Invalid JSON body" }, 400); }
    }
    try {
      const { WorkflowEngine } = await import("@/backend/workflows/WorkflowEngine");
      const result = await WorkflowEngine.trigger(workflowId, userId, input);
      return json(result, 202);
    } catch (e: any) {
      return json({ error: e?.message ?? "Workflow failed" }, 500);
    }
  }

  // /api/workflows/:id/runs
  if (tail.length === 1 && tail[0] === "runs") {
    if (method !== "GET") return json({ error: `Method ${method} not allowed` }, 405);
    const { data, error } = await supabase
      .from("workflow_runs")
      .select("id, status, started_at, completed_at, error")
      .eq("workflow_id", workflowId)
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) return json({ error: error.message }, 500);
    return json({ runs: data ?? [] });
  }

  return json({ error: "Not found" }, 404);
}

export const Route = createFileRoute("/api/workflows/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, (params as any)._splat),
      POST: async ({ request, params }) => handle(request, (params as any)._splat),
    },
  },
});