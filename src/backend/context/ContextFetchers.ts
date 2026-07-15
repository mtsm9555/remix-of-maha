import { createClient } from "@supabase/supabase-js";
import type { ContextChunk } from "./types";

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export class ContextFetchers {
  /**
   * Fetches the last N messages from the current session.
   */
  static async getRecentConversation(sessionId: string, limit: number = 5): Promise<ContextChunk[]> {
    try {
      const supabase = getClient();
      const { data, error } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return data.reverse().map((msg: any) => ({
        source: "conversation" as const,
        content: `${String(msg.role).toUpperCase()}: ${msg.content}`,
        relevanceScore: 0.9,
        metadata: { timestamp: msg.created_at },
      }));
    } catch {
      return [];
    }
  }

  /**
   * Fetches relevant long-term/short-term memory vectors.
   * TODO: replace with a pgvector RPC (e.g. match_memories).
   */
  static async getRelevantMemory(userId: string, query: string, _limit: number = 3): Promise<ContextChunk[]> {
    console.log(`[ContextFetchers] Fetching memory for user ${userId}, query: "${query}"`);
    return [
      {
        source: "memory",
        content: "User prefers dark mode and likes to be addressed as 'Sir'.",
        relevanceScore: 0.85,
        metadata: { memoryId: "mem_123" },
      },
    ];
  }

  /**
   * Fetches related entities from the Knowledge Graph.
   * TODO: replace with real graph traversal.
   */
  static async getGraphContext(query: string): Promise<ContextChunk[]> {
    console.log(`[ContextFetchers] Traversing graph for entities related to: "${query}"`);
    return [
      {
        source: "knowledge_graph",
        content: "Entity: J.A.R.V.I.S -> Relation: CREATED_BY -> Entity: Tony Stark",
        relevanceScore: 0.75,
        metadata: { entityId: "ent_456" },
      },
    ];
  }
}