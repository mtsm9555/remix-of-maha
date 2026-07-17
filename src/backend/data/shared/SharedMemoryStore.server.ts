import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateEmbedding } from "../project/EmbeddingClient.server";
import type {
  AccessLevel,
  PromotionRequestRecord,
  SharedMemoryRecord,
} from "./SharedMemoryTypes";

const CLEARANCE_RANK: Record<AccessLevel, number> = {
  public: 1,
  internal: 2,
  confidential: 3,
  restricted: 4,
};

function rowToMemory(row: any): SharedMemoryRecord {
  return {
    id: row.id,
    content: row.content,
    accessLevel: row.access_level,
    category: row.category,
    origin: row.origin,
    sourceMemoryId: row.source_memory_id,
    sourceDepartment: row.source_department,
    authorId: row.author_id,
    status: row.status,
    version: row.version,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToPromotion(row: any): PromotionRequestRecord {
  return {
    id: row.id,
    sourceMemoryId: row.source_memory_id,
    sourceDepartment: row.source_department,
    proposedContent: row.proposed_content,
    proposedAccessLevel: row.proposed_access_level,
    justification: row.justification,
    status: row.status,
    requestedBy: row.requested_by,
    approvedBy: row.approved_by,
    requestedAt: new Date(row.requested_at),
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
  };
}

export class SharedMemoryStore {
  static async storeSharedMemory(
    input: Omit<
      SharedMemoryRecord,
      "id" | "createdAt" | "updatedAt" | "embedding" | "version"
    >,
  ): Promise<SharedMemoryRecord> {
    const embedding = await generateEmbedding(input.content);
    const id = `smem_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin
      .from("shared_memories" as any)
      .insert({
        id,
        content: input.content,
        embedding: embedding as unknown as string,
        access_level: input.accessLevel,
        category: input.category,
        origin: input.origin,
        source_memory_id: input.sourceMemoryId ?? null,
        source_department: input.sourceDepartment ?? null,
        author_id: input.authorId,
        status: input.status,
        approved_by: input.approvedBy ?? null,
        approved_at: input.approvedAt ? input.approvedAt.toISOString() : null,
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`Failed to store shared memory: ${error?.message}`);
    }
    return rowToMemory(data);
  }

  static async searchGlobalMemories(
    queryEmbedding: number[],
    requesterClearance: AccessLevel,
    limit = 5,
  ): Promise<Array<SharedMemoryRecord & { similarity: number }>> {
    const { data, error } = await supabaseAdmin.rpc(
      "match_shared_memories" as any,
      {
        query_embedding: queryEmbedding as unknown as string,
        requester_clearance: requesterClearance,
        match_threshold: 0.6,
        match_count: limit,
      },
    );
    if (error || !data) {
      if (error) console.error("[SharedMemory] search failed:", error);
      return [];
    }
    const requesterRank = CLEARANCE_RANK[requesterClearance];
    return (data as any[])
      .filter((r) => CLEARANCE_RANK[r.access_level as AccessLevel] <= requesterRank)
      .map((r) => ({
        id: r.id,
        content: r.content,
        accessLevel: r.access_level,
        category: r.category,
        origin: r.origin,
        sourceDepartment: r.source_department,
        sourceMemoryId: null,
        authorId: "",
        status: "approved",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        similarity: Number(r.similarity ?? 0),
      })) as Array<SharedMemoryRecord & { similarity: number }>;
  }

  static async createPromotionRequest(
    input: Omit<
      PromotionRequestRecord,
      "id" | "requestedAt" | "status" | "approvedBy" | "approvedAt"
    > & { status?: PromotionRequestRecord["status"] },
  ): Promise<PromotionRequestRecord> {
    const id = `prom_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin
      .from("memory_promotions" as any)
      .insert({
        id,
        source_memory_id: input.sourceMemoryId ?? null,
        source_department: input.sourceDepartment ?? null,
        proposed_content: input.proposedContent,
        proposed_access_level: input.proposedAccessLevel,
        justification: input.justification,
        status: input.status ?? "pending_review",
        requested_by: input.requestedBy,
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`Failed to create promotion request: ${error?.message}`);
    }
    return rowToPromotion(data);
  }

  static async listPendingPromotions(): Promise<PromotionRequestRecord[]> {
    const { data, error } = await supabaseAdmin
      .from("memory_promotions" as any)
      .select("*")
      .eq("status", "pending_review")
      .order("requested_at", { ascending: false });
    if (error || !data) return [];
    return (data as any[]).map(rowToPromotion);
  }

  static async approvePromotion(
    promotionId: string,
    approverId: string,
  ): Promise<SharedMemoryRecord> {
    const { data: prom, error: pErr } = await supabaseAdmin
      .from("memory_promotions" as any)
      .select("*")
      .eq("id", promotionId)
      .single();
    if (pErr || !prom) throw new Error(`Promotion not found: ${pErr?.message}`);
    const p = prom as any;

    const memory = await this.storeSharedMemory({
      content: p.proposed_content,
      accessLevel: p.proposed_access_level,
      category: "promoted",
      origin: "department",
      sourceMemoryId: p.source_memory_id,
      sourceDepartment: p.source_department,
      authorId: p.requested_by,
      status: "approved",
      approvedBy: approverId,
      approvedAt: new Date(),
    });

    await supabaseAdmin
      .from("memory_promotions" as any)
      .update({
        status: "approved",
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", promotionId);

    return memory;
  }

  static async rejectPromotion(promotionId: string, approverId: string): Promise<void> {
    await supabaseAdmin
      .from("memory_promotions" as any)
      .update({
        status: "rejected",
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", promotionId);
  }
}