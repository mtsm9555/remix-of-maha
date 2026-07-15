import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const sendSchema = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  message: z.string().min(1),
});

const historySchema = z.object({
  conversationId: z.string().uuid(),
});

const SYSTEM_PROMPT =
  "You are Maha, a friendly and concise productivity assistant. Help the user organize their tasks, plan their day, and think through problems. You remember prior turns in this conversation. Keep answers short and actionable.";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => sendSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

    const admin = await getAdmin();

    // Ensure conversation exists
    let convId = data.conversationId ?? null;
    if (!convId) {
      const { data: conv, error } = await admin
        .from("conversations")
        .insert({ title: data.message.slice(0, 60) })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      convId = conv.id;
    }

    // Load prior messages (chronological)
    const { data: prior, error: loadErr } = await admin
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(50);
    if (loadErr) throw new Error(loadErr.message);

    // Persist the user message
    const { error: insertUserErr } = await admin
      .from("messages")
      .insert({ conversation_id: convId, role: "user", content: data.message });
    if (insertUserErr) throw new Error(insertUserErr.message);

    const history = (prior ?? []).map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }));
    const model = process.env.OPENROUTER_MODEL || "x-ai/grok-4-fast:free";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Maha",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: data.message },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429) throw new Error("Rate limit hit. Try again in a moment.");
      if (response.status === 402) throw new Error("OpenRouter credits exhausted.");
      throw new Error(`AI request failed: ${text}`);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const reply = json.choices[0]?.message.content ?? "";

    await admin
      .from("messages")
      .insert({ conversation_id: convId, role: "assistant", content: reply });
    await admin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", convId);

    return { conversationId: convId, reply };
  });

export const loadConversation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => historySchema.parse(data))
  .handler(async ({ data }) => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const admin = await getAdmin();
    const { data: rows, error } = await admin
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { messages: rows ?? [] };
  });

// Backwards-compatible export in case other code still references it.
export const chatWithMaha = sendChatMessage;
