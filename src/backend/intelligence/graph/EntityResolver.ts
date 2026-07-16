import type { Department } from "../../agents/departments/types";
import { osGenerate } from "../../os/llm";
import type { EntityCluster } from "./GraphExpansionTypes";

export class EntityResolver {
  static async resolveEntities(department: Department): Promise<EntityCluster[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    console.log(`[EntityResolver] Scanning duplicates for ${department}...`);

    const { data: nodes } = await supabaseAdmin
      .from("graph_nodes")
      .select("id, name, embedding")
      .eq("department", department as any);

    if (!nodes || nodes.length < 2) return [];

    const clusters: EntityCluster[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < nodes.length; i++) {
      const cur = nodes[i] as any;
      if (processedIds.has(cur.id)) continue;

      const potentialDuplicates = (nodes as any[]).filter((node, index) => {
        if (index === i || processedIds.has(node.id)) return false;
        return this.calculateCosineSimilarity(cur.embedding, node.embedding) > 0.95;
      });

      if (potentialDuplicates.length === 0) continue;

      const allNames = [cur.name, ...potentialDuplicates.map((n) => n.name)];
      const canonicalName = await this.confirmAndMerge(allNames);

      if (canonicalName) {
        clusters.push({
          primaryEntity: canonicalName,
          aliases: allNames.filter((n) => n !== canonicalName),
          department,
        });
        processedIds.add(cur.id);
        potentialDuplicates.forEach((n) => processedIds.add(n.id));
        await this.mergeNodesInDB(
          cur.id,
          potentialDuplicates.map((n) => n.id),
          canonicalName,
        );
      }
    }

    return clusters;
  }

  private static async confirmAndMerge(names: string[]): Promise<string | null> {
    const prompt = `You are a Data Quality Engine.
These entity names likely refer to the same real-world object.
Select the most accurate, canonical name. If they clearly differ, return null.

**Names:**
${JSON.stringify(names)}

Output ONLY the canonical name as a string, or null.`;
    const response = await osGenerate(prompt);
    const cleaned = response.content.replace(/"/g, "").trim();
    return cleaned.toLowerCase() === "null" || cleaned.length === 0 ? null : cleaned;
  }

  private static calculateCosineSimilarity(a: number[] | null, b: number[] | null): number {
    if (!a || !b || a.length === 0 || b.length !== a.length) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  private static async mergeNodesInDB(
    primaryId: string,
    duplicateIds: string[],
    canonicalName: string,
  ) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const dupId of duplicateIds) {
      await supabaseAdmin.rpc("transfer_edges" as any, { source_dup: dupId, target_primary: primaryId });
      await supabaseAdmin.rpc("transfer_edges" as any, {
        source_dup: dupId,
        target_primary: primaryId,
        is_reverse: true,
      });
    }
    await supabaseAdmin.from("graph_nodes").update({ name: canonicalName } as any).eq("id", primaryId);
    await supabaseAdmin.from("graph_nodes").delete().in("id", duplicateIds);
  }
}
