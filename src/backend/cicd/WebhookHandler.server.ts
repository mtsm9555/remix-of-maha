import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PipelineExecutor } from "./PipelineExecutor.server";

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class WebhookHandler {
  static async handleGitHub(rawBody: string, signature: string, tenantId: string) {
    const payload = JSON.parse(rawBody);
    const repoUrl: string = payload.repository?.html_url ?? "";
    const { data: webhook } = await supabaseAdmin
      .from("webhook_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("provider", "github")
      .eq("repository_url", repoUrl)
      .maybeSingle();
    if (!webhook) return { ok: false, reason: "no_webhook" };

    const expected = `sha256=${await hmacHex(webhook.secret, rawBody)}`;
    if (signature !== expected) throw new Error("Invalid webhook signature");

    const event = payload.ref ? "push" : "pull_request";
    const { data: pipelines } = await supabaseAdmin
      .from("pipelines")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("repository_url", repoUrl);

    const runs: string[] = [];
    for (const pipeline of pipelines ?? []) {
      const triggers = (pipeline.triggers as Array<Record<string, unknown>>) ?? [];
      for (const trigger of triggers) {
        if (!trigger.isActive) continue;
        if (trigger.type === "push" && event === "push") {
          const branch = String(payload.ref).replace("refs/heads/", "");
          const branches = trigger.branches as string[] | undefined;
          if (branches && !branches.includes(branch)) continue;
          const run = await PipelineExecutor.execute(
            pipeline.id,
            tenantId,
            "github-webhook",
            "push",
            {
              commitHash: payload.after,
              commitMessage: payload.head_commit?.message,
              branch,
            },
          );
          runs.push(run.id);
        }
      }
    }

    await supabaseAdmin
      .from("webhook_configs")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", webhook.id);

    return { ok: true, runs };
  }
}