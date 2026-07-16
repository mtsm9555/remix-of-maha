import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  DepartmentMemory,
  MemorySearchQuery,
} from "./DepartmentMemoryTypes";

export class DepartmentMemoryEngine {
  static async storeMemory(
    memory: Omit<DepartmentMemory, "id" | "metadata"> & {
      metadata?: Partial<DepartmentMemory["metadata"]>;
    },
  ): Promise<DepartmentMemory> {
    const embedding =
      memory.embedding.length > 0
        ? memory.embedding
        : await this.generateEmbedding(memory.content);

    const now = new Date();
    const fullMemory: DepartmentMemory = {
      id: crypto.randomUUID(),
      departmentId: memory.departmentId,
      type: memory.type,
      content: memory.content,
      embedding,
      importanceScore: memory.importanceScore,
      metadata: {
        createdAt: now,
        lastAccessedAt: now,
        accessCount: 0,
        ...(memory.metadata ?? {}),
      },
    };

    const { error } = await supabaseAdmin.from("department_memories").insert({
      id: fullMemory.id,
      department_id: fullMemory.departmentId,
      type: fullMemory.type,
      content: fullMemory.content,
      embedding: fullMemory.embedding.length > 0 ? (fullMemory.embedding as any) : null,
      importance_score: fullMemory.importanceScore,
      metadata: fullMemory.metadata as any,
    });

    if (error) throw new Error(`Failed to store department memory: ${error.message}`);
    console.log(`[DeptMemory] Stored ${fullMemory.type} memory for ${fullMemory.departmentId}`);
    return fullMemory;
  }

  static async searchMemories(query: MemorySearchQuery): Promise<DepartmentMemory[]> {
    if (!query.queryEmbedding || query.queryEmbedding.length === 0) {
      return [];
    }
    const { data, error } = await supabaseAdmin.rpc("match_department_memories" as any, {
      query_embedding: query.queryEmbedding as any,
      query_department: query.departmentId,
      match_threshold: 0.7,
      match_count: query.limit || 5,
      filter_types: query.types || ["procedural", "episodic", "semantic"],
    });

    if (error) {
      console.error("[DeptMemory] Search failed:", error);
      return [];
    }
    const rows = (data as any[]) || [];
    if (rows.length > 0) {
      await this.boostImportance(rows.map((m) => m.id));
    }
    return rows.map((r) => ({
      id: r.id,
      departmentId: r.department_id,
      type: r.type,
      content: r.content,
      embedding: [],
      importanceScore: r.importance_score,
      metadata: r.metadata ?? {
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        accessCount: 0,
      },
    }));
  }

  static async getRecentEpisodic(departmentId: string, limit = 5): Promise<DepartmentMemory[]> {
    const { data } = await supabaseAdmin
      .from("department_memories")
      .select("*")
      .eq("department_id", departmentId)
      .eq("type", "episodic")
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data as any[]) || []).map((r) => ({
      id: r.id,
      departmentId: r.department_id,
      type: r.type,
      content: r.content,
      embedding: [],
      importanceScore: r.importance_score,
      metadata: r.metadata,
    }));
  }

  static async applyDecay() {
    console.log("[DeptMemory] Applying memory decay to stale memories...");
    const { error } = await supabaseAdmin.rpc("decay_stale_memories" as any, {
      days_threshold: 30,
      decay_factor: 0.95,
    });
    if (error) console.error("[DeptMemory] Decay failed:", error);
  }

  private static async boostImportance(memoryIds: string[]) {
    await supabaseAdmin.rpc("boost_memory_importance" as any, { memory_ids: memoryIds });
  }

  private static async generateEmbedding(_text: string): Promise<number[]> {
    // TODO: wire to Lovable AI embeddings (google/gemini-embedding or similar).
    return [];
  }
}