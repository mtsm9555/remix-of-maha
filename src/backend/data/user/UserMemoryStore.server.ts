import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateEmbedding } from "../project/EmbeddingClient.server";
import type {
  UserContextQuery,
  UserMemoryRecord,
  UserProfile,
} from "./UserMemoryTypes";

export class UserMemoryStore {
  static async storeMemory(
    record: Omit<UserMemoryRecord, "id" | "createdAt" | "updatedAt" | "embedding">,
  ): Promise<UserMemoryRecord> {
    const embedding = await generateEmbedding(record.content);
    const id = `umem_${crypto.randomUUID()}`;

    const { data, error } = await supabaseAdmin
      .from("user_memories" as any)
      .insert({
        id,
        user_id: record.userId,
        type: record.type,
        content: record.content,
        embedding: embedding as unknown as string,
        metadata: record.metadata as any,
      })
      .select("id, user_id, type, content, metadata, created_at, updated_at")
      .single();
    if (error || !data) throw new Error(`Failed to store user memory: ${error?.message}`);

    const row = data as any;
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      content: row.content,
      embedding,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static async searchMemories(query: UserContextQuery): Promise<UserMemoryRecord[]> {
    const { data, error } = await supabaseAdmin.rpc("match_user_memories" as any, {
      query_embedding: query.taskEmbedding as unknown as string,
      query_user_id: query.userId,
      match_threshold: 0.6,
      match_count: query.limit ?? 5,
    });
    if (error || !data) {
      if (error) console.error("[UserMemory] search failed:", error);
      return [];
    }
    return (data as any[]).map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      content: r.content,
      metadata: r.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select(
        "id, email, name, category, timezone, preferred_language, communication_style, active_hours_start, active_hours_end",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as any;
    return {
      userId: row.id,
      name: row.name,
      email: row.email,
      category: row.category,
      timezone: row.timezone,
      preferredLanguage: row.preferred_language,
      communicationStyle: row.communication_style,
      activeHoursStart: row.active_hours_start,
      activeHoursEnd: row.active_hours_end,
    };
  }

  static async updatePreferences(userId: string, updates: Partial<UserProfile>) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.category !== undefined) patch.category = updates.category;
    if (updates.timezone !== undefined) patch.timezone = updates.timezone;
    if (updates.preferredLanguage !== undefined) patch.preferred_language = updates.preferredLanguage;
    if (updates.communicationStyle !== undefined) patch.communication_style = updates.communicationStyle;
    if (updates.activeHoursStart !== undefined) patch.active_hours_start = updates.activeHoursStart;
    if (updates.activeHoursEnd !== undefined) patch.active_hours_end = updates.activeHoursEnd;

    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update(patch as any)
      .eq("id", userId);
    if (error) throw new Error(`Failed to update preferences: ${error.message}`);
  }

  static async deleteMemory(userId: string, memoryId: string) {
    const { error, count } = await supabaseAdmin
      .from("user_memories" as any)
      .delete({ count: "exact" })
      .eq("id", memoryId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }
}