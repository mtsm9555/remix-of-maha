import { createServerFn } from "@tanstack/react-start";

/**
 * Gated CRUD for tasks/tools/logs. Every handler calls requireUnlocked()
 * first, then uses supabaseAdmin (service_role) since these tables are
 * locked down at the DB level and only reachable server-side.
 */

// ---------- Tasks ----------

export const listTasks = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUnlocked } = await import("./gate.server");
  await requireUnlocked();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .order("completed", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const addTask = createServerFn({ method: "POST" })
  .inputValidator((data: {
    title: string;
    description?: string | null;
    priority?: number;
    due_date?: string | null;
  }) => {
    if (!data?.title || typeof data.title !== "string" || data.title.trim().length === 0) {
      throw new Error("Title is required");
    }
    if (data.title.length > 500) throw new Error("Title too long");
    if (data.description && data.description.length > 5000) throw new Error("Description too long");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tasks").insert({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority ?? 1,
      due_date: data.due_date ?? null,
      completed: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const toggleTask = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; completed: boolean }) => {
    if (!data?.id || typeof data.id !== "string") throw new Error("id required");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("tasks")
      .update({ completed: !data.completed })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => {
    if (!data?.id || typeof data.id !== "string") throw new Error("id required");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ---------- Tools ----------

export const listTools = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUnlocked } = await import("./gate.server");
  await requireUnlocked();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("tools")
    .select("*")
    .eq("enabled", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ---------- Logs ----------

export const listLogs = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUnlocked } = await import("./gate.server");
  await requireUnlocked();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("logs")
    .select("*, tasks(title), tools(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});
