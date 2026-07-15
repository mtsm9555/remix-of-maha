import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import agencyData from "@/data/agency.json";

type Agent = {
  slug: string;
  division: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  vibe: string;
  systemPrompt: string;
};

const AGENTS = (agencyData as { agents: Agent[] }).agents;

const runInputSchema = z.object({
  slug: z.string(),
  message: z.string().min(1),
});

async function callLovableAI(systemPrompt: string, userMessage: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  const model = process.env.AGENCY_MODEL || "google/gemini-2.5-flash";
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Agent (Lovable AI) HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

export const runAgent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => runInputSchema.parse(d))
  .handler(async ({ data }): Promise<{ reply: string; agent: { name: string; division: string; emoji: string } }> => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const agent = AGENTS.find((a) => a.slug === data.slug);
    if (!agent) throw new Error(`Unknown agent: ${data.slug}`);
    const reply = await callLovableAI(agent.systemPrompt, data.message);
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("logs").insert({
        status: "success",
        message: `[agency:${agent.slug}] ${data.message.slice(0, 200)} → ${reply.slice(0, 300)}`,
      });
    } catch { /* ignore */ }
    return {
      reply,
      agent: { name: agent.name, division: agent.division, emoji: agent.emoji },
    };
  });
