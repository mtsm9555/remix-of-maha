import type { Department } from "../../agents/departments/types";
import { osGenerate } from "../../os/llm";
import type { InferredRelationship } from "./GraphExpansionTypes";

export class RelationshipInferenceEngine {
  static async inferRelationships(department: Department): Promise<InferredRelationship[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    console.log(`[InferenceEngine] Inferring for ${department}...`);

    const { data: edges } = await supabaseAdmin
      .from("graph_edges")
      .select("source_name, target_name, relation")
      .eq("department", department as any)
      .limit(50);

    if (!edges || edges.length === 0) return [];

    const graphContext = (edges as any[])
      .map((e) => `(${e.source_name}) -[${e.relation}]-> (${e.target_name})`)
      .join("\n");

    const prompt = `You are a Knowledge Graph Reasoning Engine.
Analyze explicit relationships and infer NEW implicit ones.

**Explicit Graph Data:**
${graphContext}

**Instructions:**
1. Transitive: A->B, B->C => A->C.
2. Inverse: A -manages-> B => B -reports_to-> A.
3. Only infer with >80% confidence.
4. No repeats of existing edges.

**Output strict JSON:**
{ "inferredRelationships": [ { "sourceEntity":"string","targetEntity":"string","inferredRelation":"string","confidenceScore":0.0,"reasoning":"string" } ] }`;

    try {
      const response = await osGenerate(prompt, { responseFormat: "json" });
      const parsed = JSON.parse(response.content);
      const inferred: InferredRelationship[] = parsed.inferredRelationships || [];
      for (const rel of inferred) {
        if (rel.confidenceScore > 0.8) await this.upsertInferredEdge(department, rel);
      }
      return inferred;
    } catch (error) {
      console.error("[InferenceEngine] Failed:", error);
      return [];
    }
  }

  private static async upsertInferredEdge(department: Department, rel: InferredRelationship) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("graph_edges")
      .upsert(
        {
          source_name: rel.sourceEntity,
          target_name: rel.targetEntity,
          relation: `inferred_${rel.inferredRelation}`,
          department,
          properties: { confidence: rel.confidenceScore, reasoning: rel.reasoning },
        } as any,
        { onConflict: "source_name,target_name,relation,department" },
      );
    if (error) console.error("[InferenceEngine] Edge upsert failed:", error.message);
  }
}
