import type { GraphNode, GraphEdge, TraversalResult } from "./types";

export class GraphTraverser {
  /**
   * Breadth-First Search (BFS) to find paths or related context between nodes.
   */
  static async traverse(
    userId: string,
    startNodeName: string,
    maxDepth: number = 3,
  ): Promise<TraversalResult> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: startNodes } = await supabaseAdmin
      .from("graph_nodes" as any)
      .select("*")
      .eq("user_id", userId)
      .eq("name", startNodeName)
      .limit(1);

    const startList = (startNodes as any[] | null) ?? [];
    if (startList.length === 0) return { nodes: [], edges: [] };

    const startNode = startList[0];
    const visitedNodes = new Set<string>([startNode.id]);
    const visitedEdges = new Set<string>();

    const resultNodes: GraphNode[] = [startNode];
    const resultEdges: GraphEdge[] = [];

    let currentFrontier: string[] = [startNode.id];

    for (let depth = 0; depth < maxDepth && currentFrontier.length > 0; depth++) {
      const nextFrontier: string[] = [];

      const { data: edges } = await supabaseAdmin
        .from("graph_edges" as any)
        .select("*")
        .eq("user_id", userId)
        .in("source_id", currentFrontier);

      const edgeList = (edges as any[] | null) ?? [];
      if (edgeList.length === 0) break;

      for (const edge of edgeList) {
        if (visitedEdges.has(edge.id)) continue;
        visitedEdges.add(edge.id);
        resultEdges.push({
          id: edge.id,
          sourceId: edge.source_id,
          targetId: edge.target_id,
          relation: edge.relation,
        });

        if (!visitedNodes.has(edge.target_id)) {
          visitedNodes.add(edge.target_id);
          nextFrontier.push(edge.target_id);
        }
      }

      if (nextFrontier.length > 0) {
        const { data: newNodes } = await supabaseAdmin
          .from("graph_nodes" as any)
          .select("*")
          .in("id", nextFrontier);

        if (newNodes) resultNodes.push(...(newNodes as unknown as GraphNode[]));
      }

      currentFrontier = nextFrontier;
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  /**
   * Formats the traversal result into a readable string for the LLM Context Builder.
   */
  static formatForContext(result: TraversalResult): string {
    if (result.nodes.length === 0) return "No related knowledge graph entities found.";

    const nodeMap = new Map(result.nodes.map((n) => [n.id, n.name]));

    const paths = result.edges.map((edge) => {
      const source = nodeMap.get(edge.sourceId) || "Unknown";
      const target = nodeMap.get(edge.targetId) || "Unknown";
      return `${source} -[${edge.relation}]-> ${target}`;
    });

    return `Knowledge Graph Connections:\n${paths.join("\n")}`;
  }
}