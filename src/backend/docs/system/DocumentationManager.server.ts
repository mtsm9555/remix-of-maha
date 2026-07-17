import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  SystemDocumentation,
  DocAnalytics,
  DocExport,
  DocFormat,
} from "./SystemDocumentationTypes";

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

export class SystemDocumentationManager {
  static async createDocumentation(
    tenantId: string,
    data: Partial<Omit<SystemDocumentation, "id" | "createdAt" | "updatedAt" | "tenantId">>,
  ): Promise<SystemDocumentation> {
    const id = `doc_${crypto.randomUUID()}`;
    const now = new Date();
    const row = {
      id,
      tenant_id: tenantId,
      title: data.title ?? "Untitled",
      version: data.version ?? "1.0.0",
      category: data.category ?? "developer",
      status: data.status ?? "draft",
      access_level: data.accessLevel ?? "internal",
      content: data.content ?? "",
      metadata: data.metadata ?? {},
      parent_id: data.parentId ?? null,
      child_ids: data.childIds ?? [],
      related_doc_ids: data.relatedDocIds ?? [],
      tags: data.tags ?? [],
      keywords: data.keywords ?? [],
      diagrams: data.diagrams ?? [],
      revision: data.revision ?? 1,
      last_edited_by: data.lastEditedBy ?? "system",
      view_count: 0,
      helpful_count: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      published_at: data.publishedAt?.toISOString() ?? null,
    };
    const { data: inserted, error } = await supabaseAdmin
      .from("system_documentation")
      .insert(row as any)
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(inserted);
  }

  static async getDocumentation(docId: string, tenantId: string): Promise<SystemDocumentation | null> {
    const { data } = await supabaseAdmin
      .from("system_documentation")
      .select("*")
      .eq("id", docId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!data) return null;
    await supabaseAdmin
      .from("system_documentation")
      .update({ view_count: (data.view_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", docId);
    return mapRow(data);
  }

  static async getAllDocumentation(
    tenantId: string,
    filters: { category?: string; status?: string; limit?: number } = {},
  ): Promise<SystemDocumentation[]> {
    let q = supabaseAdmin.from("system_documentation").select("*").eq("tenant_id", tenantId);
    if (filters.category) q = q.eq("category", filters.category);
    if (filters.status) q = q.eq("status", filters.status);
    q = q.order("updated_at", { ascending: false }).limit(filters.limit ?? 50);
    const { data } = await q;
    return (data ?? []).map(mapRow);
  }

  static async updateDocumentation(
    docId: string,
    tenantId: string,
    patch: Partial<SystemDocumentation>,
  ): Promise<SystemDocumentation | null> {
    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (patch.title !== undefined) update.title = patch.title;
    if (patch.content !== undefined) update.content = patch.content;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.accessLevel !== undefined) update.access_level = patch.accessLevel;
    if (patch.tags !== undefined) update.tags = patch.tags;
    if (patch.keywords !== undefined) update.keywords = patch.keywords;
    if (patch.metadata !== undefined) update.metadata = patch.metadata;
    if (patch.diagrams !== undefined) update.diagrams = patch.diagrams;
    if (patch.revision !== undefined) update.revision = patch.revision;
    if (patch.lastEditedBy !== undefined) update.last_edited_by = patch.lastEditedBy;
    const { data, error } = await supabaseAdmin
      .from("system_documentation")
      .update(update as any)
      .eq("id", docId)
      .eq("tenant_id", tenantId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : null;
  }

  static async publishDocumentation(
    docId: string,
    tenantId: string,
    publishedBy: string,
  ): Promise<SystemDocumentation | null> {
    const now = new Date();
    const { data, error } = await supabaseAdmin
      .from("system_documentation")
      .update({
        status: "published",
        published_at: now.toISOString(),
        last_edited_by: publishedBy,
        updated_at: now.toISOString(),
      })
      .eq("id", docId)
      .eq("tenant_id", tenantId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    await supabaseAdmin.from("doc_versions_sys").insert({
      id: `ver_${crypto.randomUUID()}`,
      doc_id: data.id,
      version: data.version,
      revision: data.revision,
      content: data.content,
      metadata: data.metadata,
      diagrams: data.diagrams,
      is_latest: true,
      published_at: now.toISOString(),
      published_by: publishedBy,
    });
    return mapRow(data);
  }

  static async deleteDocumentation(docId: string, tenantId: string): Promise<void> {
    await supabaseAdmin.from("system_documentation").delete().eq("id", docId).eq("tenant_id", tenantId);
  }

  static async submitFeedback(
    docId: string,
    tenantId: string,
    userId: string,
    helpful: boolean,
  ): Promise<void> {
    await supabaseAdmin.from("doc_feedback").insert({
      id: `fb_${crypto.randomUUID()}`,
      doc_id: docId,
      tenant_id: tenantId,
      user_id: userId,
      helpful,
    });
    if (helpful) {
      const { data } = await supabaseAdmin
        .from("system_documentation")
        .select("helpful_count")
        .eq("id", docId)
        .maybeSingle();
      await supabaseAdmin
        .from("system_documentation")
        .update({ helpful_count: (data?.helpful_count ?? 0) + 1 })
        .eq("id", docId);
    }
  }

  static async exportDocumentation(
    docId: string,
    tenantId: string,
    format: DocFormat,
  ): Promise<DocExport> {
    const doc = await this.getDocumentation(docId, tenantId);
    if (!doc) throw new Error("Documentation not found");
    const safe = doc.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    if (format === "markdown") {
      return { format, filename: `${safe}.md`, content: `# ${doc.title}\n\nVersion: ${doc.version}\n\n${doc.content}` };
    }
    if (format === "html") {
      return {
        format,
        filename: `${safe}.html`,
        content: `<!doctype html><html><head><title>${doc.title}</title></head><body><h1>${doc.title}</h1><pre>${doc.content}</pre></body></html>`,
      };
    }
    return { format, filename: `${safe}.txt`, content: doc.content };
  }

  static async getAnalytics(tenantId: string): Promise<DocAnalytics> {
    const { data } = await supabaseAdmin
      .from("system_documentation")
      .select("category,status,view_count,helpful_count")
      .eq("tenant_id", tenantId);
    const rows = data ?? [];
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalViews = 0;
    let totalHelpful = 0;
    let published = 0;
    for (const r of rows) {
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      totalViews += r.view_count ?? 0;
      totalHelpful += r.helpful_count ?? 0;
      if (r.status === "published") published += 1;
    }
    return {
      totalDocs: rows.length,
      publishedDocs: published,
      totalViews,
      totalHelpful,
      byCategory,
      byStatus,
    };
  }
}