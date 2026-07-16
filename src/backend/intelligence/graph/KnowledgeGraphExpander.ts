import type { Department } from "../../agents/departments/types";
import { EntityResolver } from "./EntityResolver";
import { RelationshipInferenceEngine } from "./RelationshipInferenceEngine";

export class KnowledgeGraphExpander {
  static async expandDepartmentGraph(department: Department): Promise<{
    duplicatesMerged: number;
    newRelationshipsInferred: number;
  }> {
    console.log(`[GraphExpander] Starting expansion for ${department}...`);
    const clusters = await EntityResolver.resolveEntities(department);
    const inferredRels = await RelationshipInferenceEngine.inferRelationships(department);

    const newRelationshipsInferred = inferredRels.filter((r) => r.confidenceScore > 0.8).length;

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("graph_expansion_logs" as any).insert({
        department,
        duplicates_merged: clusters.length,
        new_relationships: newRelationshipsInferred,
      });
    } catch (e) {
      console.error("[GraphExpander] Log insert failed:", e);
    }

    return { duplicatesMerged: clusters.length, newRelationshipsInferred };
  }
}
