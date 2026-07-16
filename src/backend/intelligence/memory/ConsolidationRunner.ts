import type { Department } from "../../agents/departments/types";
import { DepartmentMemoryEngine } from "../../os/memory/DepartmentMemoryEngine";
import type { RawMemory } from "./ConsolidationTypes";
import { GraphIntegrator } from "./GraphIntegrator";
import { MemoryDistiller } from "./MemoryDistiller";

export class ConsolidationRunner {
  static async consolidateDepartment(
    department: Department,
    batchSize = 50,
  ): Promise<{ memoriesExtracted: number; graphNodesUpdated: number; processed: number }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("raw_memories" as any)
      .select("id, department, source, content, created_at, is_consolidated")
      .eq("department", department)
      .eq("is_consolidated", false)
      .limit(batchSize);

    if (error) throw new Error(`Failed to fetch raw memories: ${error.message}`);
    if (!rows || rows.length === 0) {
      return { memoriesExtracted: 0, graphNodesUpdated: 0, processed: 0 };
    }

    const rawMemories: RawMemory[] = (rows as any[]).map((r) => ({
      id: r.id,
      department: r.department,
      source: r.source,
      content: r.content,
      timestamp: new Date(r.created_at),
      isConsolidated: r.is_consolidated,
    }));

    const extracted = await MemoryDistiller.distill(rawMemories);

    for (const mem of extracted) {
      await DepartmentMemoryEngine.storeMemory({
        departmentId: department,
        type: mem.type,
        content: mem.content,
        embedding: [],
        importanceScore: mem.importanceScore,
        metadata: { sourceIds: rawMemories.map((r) => r.id) } as any,
      });
    }

    const graphNodesUpdated = await GraphIntegrator.updateGraph(department, extracted);

    await supabaseAdmin
      .from("raw_memories" as any)
      .update({ is_consolidated: true })
      .in(
        "id",
        rawMemories.map((r) => r.id),
      );

    return {
      memoriesExtracted: extracted.length,
      graphNodesUpdated,
      processed: rawMemories.length,
    };
  }
}
