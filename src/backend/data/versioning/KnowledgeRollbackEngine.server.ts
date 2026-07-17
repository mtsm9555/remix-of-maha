import { KnowledgeVersionStore } from "./KnowledgeVersionStore.server";
import type {
  KnowledgeEntityType,
  KnowledgeVersion,
  RollbackResult,
} from "./KnowledgeVersioningTypes";

const TABLE_MAP: Record<KnowledgeEntityType, string> = {
  project_memory: "project_memories",
  department_memory: "department_memories",
  user_memory: "user_memories",
  shared_memory: "shared_memories",
};

export class KnowledgeRollbackEngine {
  static async rollbackToVersion(
    entityId: string,
    entityType: KnowledgeEntityType,
    targetVersionNumber: number,
    requestedBy: string,
    reason: string,
  ): Promise<RollbackResult> {
    const target = await KnowledgeVersionStore.getVersionByNumber(
      entityId,
      entityType,
      targetVersionNumber,
    );
    if (!target) {
      return {
        success: false,
        entityId,
        rolledBackToVersion: targetVersionNumber,
        newVersionNumber: 0,
        reason: `Version ${targetVersionNumber} not found`,
      };
    }

    const current = await KnowledgeVersionStore.getCurrentVersion(
      entityId,
      entityType,
    );
    const changeSummary = `Rolled back from v${current?.versionNumber ?? "N/A"} to v${targetVersionNumber}. Reason: ${reason}`;

    const restored = await KnowledgeVersionStore.createVersion(
      entityId,
      entityType,
      target.content,
      target.embedding,
      {
        ...target.metadata,
        rollbackFromVersion: current?.versionNumber,
        rollbackReason: reason,
        rollbackRequestedBy: requestedBy,
      },
      requestedBy,
      "human",
      changeSummary,
      "restored",
    );

    await this.updateLiveMemoryRecord(entityId, entityType, target);

    return {
      success: true,
      entityId,
      rolledBackToVersion: targetVersionNumber,
      newVersionNumber: restored.versionNumber,
      reason: changeSummary,
    };
  }

  private static async updateLiveMemoryRecord(
    entityId: string,
    entityType: KnowledgeEntityType,
    version: KnowledgeVersion,
  ) {
    const tableName = TABLE_MAP[entityType];
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from(tableName as never)
      .update({
        content: version.content,
        embedding: version.embedding as unknown as string,
        metadata: version.metadata as never,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", entityId);
    if (error)
      throw new Error(`Failed to update live memory: ${error.message}`);
  }
}