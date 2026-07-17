import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { DocSearchResult, SystemDocumentation } from "./SystemDocumentationTypes";

function mapRow(row: any): SystemDocumentation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    version: row.version,
    category: row.category,
    status: row.status,
    accessLevel: row.access_level,
    content: row.content,
    metadata: row.metadata ?? {},
    parentId: row.parent_id ?? undefined,
    childIds: row.child_ids ?? [],
    relatedDocIds: row.related_doc_ids ?? [],
    tags: row.tags ?? [],
    keywords: row.keywords ?? [],
    diagrams: row.diagrams ?? [],
    revision: row.revision,
    lastEditedBy: row.last_edited_by,
    viewCount: row.view_count ?? 0,
    helpfulCount: row.helpful_count ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
  };
}

export class DocumentationSearchEngine {
  static async search(
    tenantId: string,
    query: string,
    options: { category?: string; tags?: string[]; limit?: number; offset?: number } = {},
  ): Promise<DocSearchResult[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const escaped = query.replace(/[%_]/g, "\\$&");
    let q = supabaseAdmin
      .from("system_documentation")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`)
      .order("helpful_count", { ascending: false })
      .range(offset, offset + limit - 1);
    if (options.category) q = q.eq("category", options.category);
    if (options.tags?.length) q = q.overlaps("tags", options.tags);
    const { data } = await q;
    const rows = data ?? [];
    const results: DocSearchResult[] = rows.map((row: any) => ({
      doc: mapRow(row),
      score: this.score(row, query),
      highlights: this.highlights(row.content ?? "", query),
      matchedFields: this.matchedFields(row, query),
    }));
    results.sort((a, b) => b.score - a.score);
    await supabaseAdmin.from("doc_search_logs_sys").insert({
      id: `sl_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      query,
      result_count: results.length,
    });
    return results;
  }

  private static score(row: any, query: string): number {
    const q = query.toLowerCase();
    let s = 0;
    if (row.title?.toLowerCase().includes(q)) s += 50;
    const matches = ((row.content ?? "").toLowerCase().match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
    s += Math.min(30, matches * 2);
    if ((row.keywords ?? []).some((k: string) => k.toLowerCase().includes(q))) s += 20;
    if ((row.tags ?? []).some((t: string) => t.toLowerCase().includes(q))) s += 10;
    return s;
  }

  private static highlights(content: string, query: string): string[] {
    const results: string[] = [];
    const q = query.toLowerCase();
    const lower = content.toLowerCase();
    let idx = lower.indexOf(q);
    while (idx !== -1 && results.length < 3) {
      results.push(content.slice(Math.max(0, idx - 40), idx + query.length + 40));
      idx = lower.indexOf(q, idx + q.length);
    }
    return results;
  }

  private static matchedFields(row: any, query: string): string[] {
    const q = query.toLowerCase();
    const fields: string[] = [];
    if (row.title?.toLowerCase().includes(q)) fields.push("title");
    if ((row.content ?? "").toLowerCase().includes(q)) fields.push("content");
    if ((row.keywords ?? []).some((k: string) => k.toLowerCase().includes(q))) fields.push("keywords");
    if ((row.tags ?? []).some((t: string) => t.toLowerCase().includes(q))) fields.push("tags");
    return fields;
  }
}