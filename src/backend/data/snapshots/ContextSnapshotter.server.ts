import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  BuiltContextLike,
  ContextSnapshot,
  SnapshotChunkMetadata,
} from "./ContextSnapshotTypes";

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function rowToSnapshot(row: any): ContextSnapshot {
  return {
    id: row.id,
    taskId: row.task_id,
    agentId: row.agent_id,
    department: row.department,
    promptHash: row.prompt_hash,
    fullPromptText: row.full_prompt_text,
    chunkMetadata: (row.chunk_metadata ?? []) as SnapshotChunkMetadata[],
    totalTokens: row.total_tokens,
    estimatedCostUSD: row.estimated_cost_usd,
    llmModelUsed: row.llm_model_used,
    llmTemperature: row.llm_temperature,
    createdAt: new Date(row.created_at),
  };
}

export class ContextSnapshotter {
  static async capture(
    taskId: string,
    agentId: string,
    department: string,
    builtContext: BuiltContextLike,
    llmConfig: { model: string; temperature: number },
  ): Promise<ContextSnapshot> {
    const promptHash = await sha256Hex(builtContext.assembledPrompt);

    const chunkMetadata: SnapshotChunkMetadata[] = builtContext.chunks.map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      relevanceScore: chunk.relevanceScore,
      tokenEstimate: chunk.tokenEstimate,
      contentPreview:
        chunk.content.substring(0, 150) + (chunk.content.length > 150 ? "..." : ""),
    }));

    const estimatedCostUSD = builtContext.totalTokens * 0.00001;

    const snapshot: ContextSnapshot = {
      id: `snap_${crypto.randomUUID()}`,
      taskId,
      agentId,
      department,
      promptHash,
      fullPromptText: builtContext.assembledPrompt,
      chunkMetadata,
      totalTokens: builtContext.totalTokens,
      estimatedCostUSD,
      llmModelUsed: llmConfig.model,
      llmTemperature: llmConfig.temperature,
      createdAt: new Date(),
    };

    void this.persistSnapshot(snapshot);
    return snapshot;
  }

  static async findDuplicatePrompt(promptHash: string): Promise<ContextSnapshot | null> {
    const { data, error } = await supabaseAdmin
      .from("context_snapshots" as any)
      .select("*")
      .eq("prompt_hash", promptHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return rowToSnapshot(data);
  }

  static async getSnapshot(id: string): Promise<ContextSnapshot | null> {
    const { data, error } = await supabaseAdmin
      .from("context_snapshots" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return rowToSnapshot(data);
  }

  static async listByTask(taskId: string) {
    const { data, error } = await supabaseAdmin
      .from("context_snapshots" as any)
      .select(
        "id, prompt_hash, total_tokens, estimated_cost_usd, llm_model_used, created_at",
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data as any[];
  }

  private static async persistSnapshot(snapshot: ContextSnapshot) {
    const { error } = await supabaseAdmin.from("context_snapshots" as any).insert({
      id: snapshot.id,
      task_id: snapshot.taskId,
      agent_id: snapshot.agentId,
      department: snapshot.department,
      prompt_hash: snapshot.promptHash,
      full_prompt_text: snapshot.fullPromptText,
      chunk_metadata: snapshot.chunkMetadata as any,
      total_tokens: snapshot.totalTokens,
      estimated_cost_usd: snapshot.estimatedCostUSD,
      llm_model_used: snapshot.llmModelUsed,
      llm_temperature: snapshot.llmTemperature,
    });
    if (error) console.error("[ContextSnapshotter] persist failed:", error);
  }
}