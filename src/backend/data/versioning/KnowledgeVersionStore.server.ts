import type {
  KnowledgeEntityType,
  KnowledgeVersion,
} from "./KnowledgeVersioningTypes";

type Row = {
  id: string;
  entity_id: string;
  entity_type: KnowledgeEntityType;
  version_number: number;
  content: string;
  embedding: number[] | string | null;
  metadata: Record<string, unknown> | null;
  author_id: string;
  author_type: "human" | "agent" | "system";
  change_summary: string;
  change_type: KnowledgeVersion["changeType"];
  parent_version_id: string | null;
  is_current_version: boolean;
  created_at: string;
};

function toEmbedding(v: Row["embedding"]): number[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as number[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toVersion(row: Row): KnowledgeVersion {
  return {
    id: row.id,
    entityId: row.entity_id,
    entityType: row.entity_type,
    versionNumber: row.version_number,
    content: row.content,
    embedding: toEmbedding(row.embedding),
    metadata: row.metadata ?? {},
    authorId: row.author_id,
    authorType: row.author_type,
    changeSummary: row.change_summary,
    changeType: row.change_type,
    parentVersionId: row.parent_version_id,
    isCurrentVersion: row.is_current_version,
    createdAt: new Date(row.created_at),
  };
}

export class KnowledgeVersionStore {
  static async createVersion(
    entityId: string,
    entityType: KnowledgeEntityType,
    content: string,
    embedding: number[],
    metadata: Record<string, unknown>,
    authorId: string,
    authorType: "human" | "agent" | "system",
    changeSummary: string,
    changeType: KnowledgeVersion["changeType"],
  ): Promise<KnowledgeVersion> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const current = await this.getCurrentVersion(entityId, entityType);
    const newVersionNumber = current ? current.versionNumber + 1 : 1;

    if (current) {
      await supabaseAdmin
        .from("knowledge_versions")
        .update({ is_current_version: false })
        .eq("id", current.id);
    }

    const id = `ver_${entityType}_${entityId}_${newVersionNumber}`;
    const createdAt = new Date();

    const { error } = await supabaseAdmin.from("knowledge_versions").insert({
      id,
      entity_id: entityId,
      entity_type: entityType,
      version_number: newVersionNumber,
      content,
      embedding: embedding as unknown as string,
      metadata: metadata as never,
      author_id: authorId,
      author_type: authorType,
      change_summary: changeSummary,
      change_type: changeType,
      parent_version_id: current?.id ?? null,
      is_current_version: true,
      created_at: createdAt.toISOString(),
    });

    if (error) throw new Error(`Failed to create version: ${error.message}`);

    return {
      id,
      entityId,
      entityType,
      versionNumber: newVersionNumber,
      content,
      embedding,
      metadata,
      authorId,
      authorType,
      changeSummary,
      changeType,
      parentVersionId: current?.id ?? null,
      isCurrentVersion: true,
      createdAt,
    };
  }

  static async getCurrentVersion(
    entityId: string,
    entityType: KnowledgeEntityType,
  ): Promise<KnowledgeVersion | null> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("knowledge_versions")
      .select("*")
      .eq("entity_id", entityId)
      .eq("entity_type", entityType)
      .eq("is_current_version", true)
      .maybeSingle();
    return data ? toVersion(data as unknown as Row) : null;
  }

  static async getVersionHistory(
    entityId: string,
    entityType: KnowledgeEntityType,
    limit = 50,
  ): Promise<KnowledgeVersion[]> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("knowledge_versions")
      .select("*")
      .eq("entity_id", entityId)
      .eq("entity_type", entityType)
      .order("version_number", { ascending: false })
      .limit(limit);
    return (data ?? []).map((r) => toVersion(r as unknown as Row));
  }

  static async getVersion(versionId: string): Promise<KnowledgeVersion | null> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("knowledge_versions")
      .select("*")
      .eq("id", versionId)
      .maybeSingle();
    return data ? toVersion(data as unknown as Row) : null;
  }

  static async getVersionByNumber(
    entityId: string,
    entityType: KnowledgeEntityType,
    versionNumber: number,
  ): Promise<KnowledgeVersion | null> {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("knowledge_versions")
      .select("*")
      .eq("entity_id", entityId)
      .eq("entity_type", entityType)
      .eq("version_number", versionNumber)
      .maybeSingle();
    return data ? toVersion(data as unknown as Row) : null;
  }
}