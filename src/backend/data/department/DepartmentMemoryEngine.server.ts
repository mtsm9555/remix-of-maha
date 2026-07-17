import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Department } from "../../agents/departments/types";
import type { DepartmentMemoryType } from "./DepartmentMemoryTypes";

export class DepartmentMemoryEngine {
  /** Weighted semantic search, boosting synthesized and positive-KPI memories. */
  static async searchMemories(params: {
    departmentId: Department;
    queryEmbedding: number[];
    types?: DepartmentMemoryType[];
    limit?: number;
  }) {
    const { data, error } = await supabaseAdmin.rpc(
      "match_department_memories_v2" as any,
      {
        query_embedding: params.queryEmbedding as unknown as string,
        query_department: params.departmentId,
        match_threshold: 0.65,
        match_count: params.limit ?? 10,
        filter_types: params.types ?? [
          "procedural",
          "semantic",
          "project_lesson",
          "kpi_insight",
        ],
      },
    );
    if (error || !data) {
      if (error) console.error("[DepartmentMemory] search failed:", error);
      return [];
    }

    const ranked = (data as any[])
      .map((mem) => {
        let boost = 0;
        if (mem.synthesis_state === "synthesized") boost += 0.15;
        if (mem.kpi_impact && Number(mem.kpi_impact.impactScore) > 0) boost += 0.1;
        return { ...mem, finalScore: (mem.similarity ?? 0) + boost };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    const topIds = ranked.slice(0, 3).map((m) => m.id);
    if (topIds.length > 0) {
      await supabaseAdmin.rpc("boost_department_memory_access" as any, {
        memory_ids: topIds,
      });
    }
    return ranked;
  }

  /** Recent synthesized, project-derived insights for a department. */
  static async getRecentProjectInsights(departmentId: Department, limit = 5) {
    const { data } = await supabaseAdmin
      .from("department_memories")
      .select("*")
      .eq("department_id", departmentId)
      .eq("synthesis_state" as any, "synthesized")
      .not("source_project_id" as any, "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }
}