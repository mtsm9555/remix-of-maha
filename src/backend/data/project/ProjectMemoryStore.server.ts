import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateEmbedding } from "./EmbeddingClient.server";
import type {
  ProjectContext,
  ProjectMemoryRecord,
  ProjectMemorySearchQuery,
} from "./ProjectMemoryTypes";

export class ProjectMemoryStore {
  /** Stores a new memory record in the project's isolated silo. */
  static async storeMemory(
    record: Omit<ProjectMemoryRecord, "id" | "createdAt" | "updatedAt" | "embedding">,
  ): Promise<ProjectMemoryRecord> {
    const embedding = await generateEmbedding(record.content);
    const id = `pmem_${crypto.randomUUID()}`;

    const { data, error } = await supabaseAdmin
      .from("project_memories")
      .insert({
        id,
        project_id: record.projectId,
        type: record.type,
        content: record.content,
        embedding: embedding as unknown as string,
        metadata: (record.metadata ?? {}) as any,
      })
      .select("id, project_id, type, content, metadata, created_at, updated_at")
      .single();
    if (error) throw new Error(`Failed to store project memory: ${error.message}`);

    return {
      id: data.id,
      projectId: data.project_id,
      type: data.type as ProjectMemoryRecord["type"],
      content: data.content,
      metadata: (data.metadata ?? {}) as ProjectMemoryRecord["metadata"],
      embedding,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /** Semantic search within a specific project's memory silo. */
  static async searchMemories(query: ProjectMemorySearchQuery) {
    const { data, error } = await supabaseAdmin.rpc("match_project_memories", {
      query_embedding: query.queryEmbedding as unknown as string,
      query_project_id: query.projectId,
      match_threshold: query.minConfidence ?? 0.7,
      match_count: query.limit ?? 5,
      filter_types: query.types ?? [
        "brief",
        "meeting_notes",
        "decision",
        "feedback",
      ],
    });
    if (error) {
      console.error("[ProjectMemory] Search failed:", error);
      return [];
    }
    return (data ?? []) as Array<{
      id: string;
      project_id: string;
      type: string;
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }>;
  }

  /** Fetches the high-level context/summary of a project. */
  static async getProjectContext(projectId: string): Promise<ProjectContext | null> {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("id, name, client_name, active_phase, summary")
      .eq("id", projectId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      projectId: data.id,
      projectName: data.name,
      clientName: data.client_name,
      activePhase: data.active_phase as ProjectContext["activePhase"],
      summary: data.summary,
    };
  }
}