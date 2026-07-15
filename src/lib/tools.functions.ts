import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  tool: z.enum(["hermes", "picoclaw", "nemotron-ocr", "nvidia-build", "n8n", "openclaw", "genspark", "orchestrator"]),
  input: z.string(),
});


function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

const HERMES_SYSTEM_PROMPT =
  "You are Hermes, a self-improving AI agent inspired by Nous Research's Hermes Agent. " +
  "Be concise, capable, and helpful. Reason step-by-step when useful, and produce clean, actionable answers.";

async function runHermes(prompt: string): Promise<string> {
  // If a self-hosted Hermes gateway is configured, use it. Otherwise fall back
  // to Lovable AI Gateway so the tool works out of the box.
  const externalBase = process.env.HERMES_BASE_URL;
  const externalKey = process.env.HERMES_API_KEY;

  if (externalBase && externalKey) {
    const base = externalBase.replace(/\/$/, "");
    const model = process.env.HERMES_MODEL || "hermes-agent";
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${externalKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: HERMES_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Hermes HTTP ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      text?: string;
    };
    return data.choices?.[0]?.message?.content ?? data.text ?? "";
  }

  const key = requireEnv("LOVABLE_API_KEY");
  const model = process.env.HERMES_MODEL || "google/gemini-2.5-flash";
  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: HERMES_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch (err) {
    const e = err as Error & { cause?: unknown };
    const cause = e.cause instanceof Error ? `${e.cause.name}: ${e.cause.message}` : String(e.cause ?? "");
    throw new Error(`Hermes fetch to gateway failed: ${e.message}${cause ? ` (cause: ${cause})` : ""}`);
  }
  if (!res.ok) throw new Error(`Hermes (Lovable AI) HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

const PICOCLAW_SYSTEM_PROMPT =
  "You are Picoclaw, an ultra-lightweight, terse AI assistant inspired by Sipeed's PicoClaw. " +
  "Answer with the shortest useful reply. Prefer imperative, single-purpose responses. " +
  "When given a command-like input, simulate the tool call and return only the result.";

async function runPicoclaw(command: string): Promise<string> {
  // If a self-hosted Picoclaw server is configured, use it. Otherwise fall
  // back to Lovable AI Gateway so the tool works out of the box.
  const externalBase = process.env.PICOCLAW_BASE_URL;
  const externalKey = process.env.PICOCLAW_API_KEY;

  if (externalBase && externalKey) {
    const base = externalBase.replace(/\/$/, "");
    const res = await fetch(`${base}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${externalKey}` },
      body: JSON.stringify({ command }),
    });
    if (!res.ok) throw new Error(`Picoclaw HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }

  const key = requireEnv("LOVABLE_API_KEY");
  const model = process.env.PICOCLAW_MODEL || "google/gemini-2.5-flash";
  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: PICOCLAW_SYSTEM_PROMPT },
          { role: "user", content: command },
        ],
      }),
    });
  } catch (err) {
    const e = err as Error & { cause?: unknown };
    const cause = e.cause instanceof Error ? `${e.cause.name}: ${e.cause.message}` : String(e.cause ?? "");
    throw new Error(`Picoclaw fetch to gateway failed: ${e.message}${cause ? ` (cause: ${cause})` : ""}`);
  }
  if (!res.ok) throw new Error(`Picoclaw (Lovable AI) HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}


const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";

async function runNemotronOcr(imageUrl: string): Promise<string> {
  // Prefer NVIDIA-hosted Nemotron if a key and model URL are configured.
  // Otherwise fall back to Lovable AI Gateway (Gemini) for OCR so the tool
  // works out of the box.
  const nvKey = process.env.NEMOTRON_OCR_API_KEY;
  const nvModel = process.env.NEMOTRON_OCR_MODEL;
  if (nvKey && nvModel) {
    const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${nvKey}` },
      body: JSON.stringify({
        model: nvModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all text from this image. Return plain text only." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 2048,
      }),
    });
    if (!res.ok) throw new Error(`Nemotron OCR HTTP ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? "";
  }

  const key = requireEnv("LOVABLE_API_KEY");
  const model = process.env.NEMOTRON_OCR_FALLBACK_MODEL || "google/gemini-2.5-flash";
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
        {
          role: "user",
          content: [
            { type: "text", text: "Describe/OCR this image. Return the extracted text (or, if there's no text, a short one-line caption). Plain text only." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Nemotron OCR (Lovable AI) HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

async function runNvidiaBuild(raw: string): Promise<unknown> {
  let model = process.env.NVIDIA_BUILD_MODEL || "meta/llama-3.3-70b-instruct";
  let prompt = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as { model?: string; skill?: string; input?: unknown; prompt?: string };
      if (obj.model) model = obj.model;
      if (obj.prompt) prompt = obj.prompt;
      else if (typeof obj.input === "string") prompt = obj.input;
      else if (obj.input !== undefined) prompt = JSON.stringify(obj.input);
    }
  } catch {
    /* plain string prompt */
  }

  // Prefer NVIDIA-hosted model if the key is configured. Otherwise fall back
  // to Lovable AI Gateway so this tool works out of the box like the others.
  const nvKey = process.env.NVIDIA_BUILD_API_KEY;
  if (nvKey) {
    const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${nvKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(`NVIDIA Build HTTP ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? data;
  }

  const lovableKey = requireEnv("LOVABLE_API_KEY");
  const fbModel = process.env.NVIDIA_BUILD_FALLBACK_MODEL || "google/gemini-2.5-flash";
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": lovableKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model: fbModel,
      messages: [
        {
          role: "system",
          content:
            "You are simulating an NVIDIA Build hosted LLM. Answer the user's request precisely and concisely.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`NVIDIA Build (Lovable AI) HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

const N8N_SYSTEM_PROMPT =
  "You are a simulator for n8n workflow executions. Given a workflow id and JSON payload, " +
  "respond with a compact JSON object representing a plausible workflow execution result " +
  "(fields like executionId, status, startedAt, finishedAt, data). Return JSON only, no prose.";

async function runN8N(raw: string): Promise<unknown> {
  let workflowId = raw.trim();
  let payload: unknown = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as { workflowId?: string; payload?: unknown };
      if (obj.workflowId) workflowId = obj.workflowId;
      if (obj.payload !== undefined) payload = obj.payload;
    }
  } catch {
    /* raw = workflow id */
  }
  if (!workflowId) throw new Error("workflowId is required");

  // If a real n8n webhook base is configured, call it. Otherwise fall back to
  // Lovable AI Gateway so the tool works out of the box.
  const base = process.env.N8N_WEBHOOK_BASE_URL;
  const key = process.env.N8N_API_KEY;

  if (base) {
    const res = await fetch(`${base.replace(/\/$/, "")}/${workflowId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "X-API-KEY": key } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`n8n HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  const lovableKey = requireEnv("LOVABLE_API_KEY");
  const model = process.env.N8N_MODEL || "google/gemini-2.5-flash";
  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: N8N_SYSTEM_PROMPT },
          {
            role: "user",
            content: `workflowId: ${workflowId}\npayload: ${JSON.stringify(payload)}`,
          },
        ],
      }),
    });
  } catch (err) {
    const e = err as Error & { cause?: unknown };
    const cause = e.cause instanceof Error ? `${e.cause.name}: ${e.cause.message}` : String(e.cause ?? "");
    throw new Error(`n8n fetch to gateway failed: ${e.message}${cause ? ` (cause: ${cause})` : ""}`);
  }
  if (!res.ok) throw new Error(`n8n (Lovable AI) HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const OPENCLAW_SYSTEM_PROMPT =
  "You are OpenClaw, a personal AI assistant (github.com/openclaw/openclaw). " +
  "You answer on the user's channels (WhatsApp, Telegram, Slack, Discord, iMessage, etc.). " +
  "Be direct, capable, and helpful. Include a short 'delivered via: <channel>' hint when relevant.";

async function runOpenClaw(prompt: string): Promise<string> {
  // If a local/remote OpenClaw gateway is configured, hit it. Otherwise fall
  // back to Lovable AI Gateway so the tool works out of the box.
  const base = process.env.OPENCLAW_GATEWAY_URL;
  const key = process.env.OPENCLAW_API_KEY;

  if (base) {
    const res = await fetch(`${base.replace(/\/$/, "")}/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({ message: prompt }),
    });
    if (!res.ok) throw new Error(`OpenClaw HTTP ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { reply?: string; message?: string; text?: string };
    return data.reply ?? data.message ?? data.text ?? JSON.stringify(data);
  }

  const lovableKey = requireEnv("LOVABLE_API_KEY");
  const model = process.env.OPENCLAW_MODEL || "google/gemini-2.5-flash";
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": lovableKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: OPENCLAW_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenClaw (Lovable AI) HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

// Orchestrator: picks the right tool for a natural-language task, runs it,
// then hands the result to OpenClaw to summarise the final answer for the user.
// This is how tools "connect to each other".
type ToolName = "hermes" | "picoclaw" | "nemotron-ocr" | "nvidia-build" | "n8n" | "openclaw" | "genspark";

async function pickTool(task: string): Promise<{ tool: ToolName; input: string; reason: string }> {
  const lovableKey = requireEnv("LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": lovableKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a strict tool router. Return JSON: {tool, input, reason}.\n\n" +
            "Available tools:\n" +
            "- genspark: autonomous research & PLANNING super-agent. Delivers structured Goal/Plan/Research/Answer/Next-steps output.\n" +
            "- hermes: short reasoning or conversational chat replies.\n" +
            "- picoclaw: ultra-short command-style responses (e.g. ping, echo).\n" +
            "- nemotron-ocr: extract text from an image URL.\n" +
            "- nvidia-build: NVIDIA-hosted LLM, expects JSON {skill,input}.\n" +
            "- n8n: run/simulate an n8n workflow, expects JSON {workflowId,payload}.\n" +
            "- openclaw: personal assistant reply for messaging channels.\n\n" +
            "ROUTING RULES (in priority order):\n" +
            "1. If the task involves ANY of: research, planning, strategy, comparison, buyer's guide, market analysis, " +
            "'how should I', 'help me plan', roadmap, step-by-step plan, evaluate options, pros/cons, decision, " +
            "multi-step task breakdown, or requires a decision-ready deliverable → ALWAYS pick 'genspark'.\n" +
            "2. If it's an image URL to transcribe → 'nemotron-ocr'.\n" +
            "3. If it's a workflow JSON with workflowId → 'n8n'.\n" +
            "4. If it's a JSON with skill+input → 'nvidia-build'.\n" +
            "5. If it's a one-word command like 'ping' → 'picoclaw'.\n" +
            "6. If it's a message to send on a channel (WhatsApp/Slack/etc.) → 'openclaw'.\n" +
            "7. Otherwise (simple chat/reasoning) → 'hermes'.\n\n" +
            "Craft 'input' as the exact string the chosen tool should receive. When routing to genspark, pass the user's task verbatim.",
        },
        { role: "user", content: task },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Orchestrator router HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text) as { tool?: ToolName; input?: string; reason?: string };
  const tool = parsed.tool ?? "hermes";
  return { tool, input: parsed.input ?? task, reason: parsed.reason ?? "" };
}

async function runByName(tool: ToolName, input: string): Promise<string> {
  const toText = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));
  switch (tool) {
    case "hermes": return await runHermes(input);
    case "picoclaw": return toText(await runPicoclaw(input));
    case "nemotron-ocr": return await runNemotronOcr(input);
    case "nvidia-build": return toText(await runNvidiaBuild(input));
    case "n8n": return toText(await runN8N(input));
    case "openclaw": return await runOpenClaw(input);
    case "genspark": return await runGenspark(input);
  }
}

async function runOrchestrator(task: string): Promise<string> {
  const plan = await pickTool(task);
  const raw = await runByName(plan.tool, plan.input);
  // Hand off to OpenClaw for a final user-facing reply — this is the
  // cross-tool "connection": planner → executor → assistant.
  const finalPrompt =
    `User task: ${task}\n\nRouted to tool: ${plan.tool} (${plan.reason})\n` +
    `Tool input: ${plan.input}\nTool output:\n${raw}\n\n` +
    `Write a concise final answer to the user based on the tool output.`;
  const summary = await runOpenClaw(finalPrompt);
  return [
    `🧭 plan: ${plan.tool} — ${plan.reason}`,
    `📥 input: ${plan.input}`,
    `🔧 tool output:\n${raw}`,
    `✅ final:\n${summary}`,
  ].join("\n\n");
}

async function logResult(status: "success" | "error", message: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("logs").insert({ status, message });
  } catch (err) {
    console.warn("[tools] log insert failed:", err instanceof Error ? err.message : err);
  }
}
const GENSPARK_SYSTEM_PROMPT =
  "You are Genspark Super Agent — an autonomous research and planning agent inspired by genspark.ai. " +
  "Given any task, respond in this exact structure:\n\n" +
  "**🎯 Goal**\n<one-line restated objective>\n\n" +
  "**🧭 Plan**\n1. …\n2. …\n3. …\n\n" +
  "**🔎 Research notes**\n- key facts, sources, considerations\n\n" +
  "**✅ Answer**\n<the final deliverable, richly formatted in markdown>\n\n" +
  "**➡️ Suggested next steps**\n- …\n\n" +
  "Be thorough, cite reasoning, and produce professional, decision-ready output.";

async function runGenspark(task: string): Promise<string> {
  const key = requireEnv("LOVABLE_API_KEY");
  const model = process.env.GENSPARK_MODEL || "google/gemini-2.5-flash";
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
        { role: "system", content: GENSPARK_SYSTEM_PROMPT },
        { role: "user", content: task },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Genspark (Lovable AI) HTTP ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}


export const runTool = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ output: string }> => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const toText = (v: unknown) =>
      typeof v === "string" ? v : JSON.stringify(v, null, 2);

    let output = "";
    try {
      switch (data.tool) {
        case "hermes":
          output = await runHermes(data.input);
          break;
        case "picoclaw":
          output = toText(await runPicoclaw(data.input));
          break;
        case "nemotron-ocr":
          output = await runNemotronOcr(data.input);
          break;
        case "nvidia-build":
          output = toText(await runNvidiaBuild(data.input));
          break;
        case "n8n":
          output = toText(await runN8N(data.input));
          break;
        case "openclaw":
          output = await runOpenClaw(data.input);
          break;
        case "genspark":
          output = await runGenspark(data.input);
          break;
        case "orchestrator":
          output = await runOrchestrator(data.input);
          break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logResult("error", `[${data.tool}] input=${data.input.slice(0, 200)} → ${msg}`);
      throw err;
    }
    await logResult("success", `[${data.tool}] input=${data.input.slice(0, 200)} → ${output.slice(0, 500)}`);
    return { output };
  });

const routeInputSchema = z.object({
  task: z.string().min(1),
  execute: z.boolean().optional(),
});

export const routeTask = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => routeInputSchema.parse(data))
  .handler(async ({ data }): Promise<{
    tool: ToolName;
    input: string;
    reason: string;
    routerMs: number;
    output?: string;
    executionMs?: number;
    error?: string;
  }> => {
    const { requireUnlocked } = await import("./gate.server");
    await requireUnlocked();
    const t0 = Date.now();
    const plan = await pickTool(data.task);
    const routerMs = Date.now() - t0;
    if (!data.execute) {
      return { tool: plan.tool, input: plan.input, reason: plan.reason, routerMs };
    }
    const t1 = Date.now();
    try {
      const output = await runByName(plan.tool, plan.input);
      return {
        tool: plan.tool,
        input: plan.input,
        reason: plan.reason,
        routerMs,
        output,
        executionMs: Date.now() - t1,
      };
    } catch (err) {
      return {
        tool: plan.tool,
        input: plan.input,
        reason: plan.reason,
        routerMs,
        error: err instanceof Error ? err.message : String(err),
        executionMs: Date.now() - t1,
      };
    }
  });


