import type { ExtractedMemory } from "./ConsolidationTypes";

export class GraphIntegrator {
  static async updateGraph(department: string, memories: ExtractedMemory[]): Promise<number> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let nodesUpdated = 0;

    for (const memory of memories) {
      for (const entity of memory.entities) {
        const { error } = await supabaseAdmin
          .from("graph_nodes")
          .upsert(
            { name: entity, department, label: "ENTITY" } as any,
            { onConflict: "name,department" },
          );
        if (error) console.error("[GraphIntegrator] Node upsert failed:", error.message);
        else nodesUpdated++;
      }

      for (const rel of memory.relationships) {
        const { error } = await supabaseAdmin
          .from("graph_edges")
          .upsert(
            {
              source_name: rel.source,
              target_name: rel.target,
              relation: rel.relation,
              department,
            } as any,
            { onConflict: "source_name,target_name,relation,department" },
          );
        if (error) console.error("[GraphIntegrator] Edge upsert failed:", error.message);
      }
    }

    return nodesUpdated;
  }
}
