import type { GraphNode } from "./types";

export class KnowledgeGraph {
  /**
   * GRAPH EXPANSION: Ingests entities and relationships from the Memory Worker.
   * Requires `graph_nodes` and `graph_edges` tables with the appropriate unique constraints.
   */
  static async expandGraph(
    userId: string,
    entities: string[],
    relationships: { source: string; relation: string; target: string }[],
  ) {
    console.log(
      `[KnowledgeGraph] Expanding graph with ${entities.length} entities and ${relationships.length} relationships.`,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const nodeRecords = entities.map((name) => ({
      user_id: userId,
      name,
      label: this.inferLabel(name),
    }));

    const { data: nodes, error: nodeError } = await supabaseAdmin
      .from("graph_nodes" as any)
      .upsert(nodeRecords, { onConflict: "user_id,name" })
      .select();

    if (nodeError) throw new Error(`Graph Node Upsert Failed: ${nodeError.message}`);

    const edgeRecords: any[] = [];
    for (const rel of relationships) {
      const sourceNode = (nodes as any[] | null)?.find((n) => n.name === rel.source);
      const targetNode = (nodes as any[] | null)?.find((n) => n.name === rel.target);

      if (sourceNode && targetNode) {
        edgeRecords.push({
          user_id: userId,
          source_id: sourceNode.id,
          target_id: targetNode.id,
          relation: rel.relation,
        });
      }
    }

    if (edgeRecords.length > 0) {
      const { error: edgeError } = await supabaseAdmin
        .from("graph_edges" as any)
        .upsert(edgeRecords, { onConflict: "user_id,source_id,target_id,relation" });

      if (edgeError) throw new Error(`Graph Edge Upsert Failed: ${edgeError.message}`);
    }

    console.log(`[KnowledgeGraph] Expansion complete.`);
  }

  /**
   * GRAPH SEARCH: Finds nodes based on text similarity.
   * TODO: swap to pgvector RPC `match_graph_nodes` in production.
   */
  static async searchNodes(userId: string, query: string, limit: number = 5): Promise<GraphNode[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("graph_nodes" as any)
      .select("*")
      .eq("user_id", userId)
      .ilike("name", `%${query}%`)
      .limit(limit);

    if (error) return [];
    return (data as unknown as GraphNode[]) || [];
  }

  private static inferLabel(name: string): string {
    if (name === name.toUpperCase()) return "CONCEPT";
    return "ENTITY";
  }
}