import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { KnowledgeSearchResult, Article } from "./KnowledgeBaseTypes";

const db = supabaseAdmin as any;

function mapArticle(d: any): Article {
  return {
    id: d.id,
    tenantId: d.tenant_id,
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt ?? undefined,
    content: d.content,
    contentType: d.content_type,
    type: d.type,
    status: d.status,
    accessLevel: d.access_level,
    categoryId: d.category_id ?? undefined,
    tags: d.tags || [],
    relatedArticleIds: d.related_article_ids || [],
    authorId: d.author_id,
    version: d.version,
    publishedAt: d.published_at ? new Date(d.published_at) : undefined,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
    viewCount: d.view_count ?? 0,
    helpfulCount: d.helpful_count ?? 0,
    notHelpfulCount: d.not_helpful_count ?? 0,
    averageRating: d.average_rating ?? 0,
    keywords: d.keywords || [],
    aiGenerated: d.ai_generated ?? false,
    metadata: d.metadata || {},
  };
}

function extractHighlights(content: string, query: string, max = 3): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const sentences = content.split(/(?<=[.!?])\s+/);
  const hits: string[] = [];
  for (const s of sentences) {
    const low = s.toLowerCase();
    if (terms.some((t) => low.includes(t))) hits.push(s.trim().substring(0, 220));
    if (hits.length >= max) break;
  }
  return hits;
}

export class KnowledgeSearchEngine {
  static async search(
    tenantId: string,
    query: string,
    options: { limit?: number; categoryId?: string; tags?: string[]; userId?: string } = {},
  ): Promise<KnowledgeSearchResult[]> {
    const limit = options.limit || 20;
    let q = db
      .from('kb_articles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .limit(limit);
    if (options.categoryId) q = q.eq('category_id', options.categoryId);
    if (options.tags?.length) q = q.overlaps('tags', options.tags);
    const { data } = await q;
    const results: KnowledgeSearchResult[] = (data || []).map((row: any) => {
      const lower = query.toLowerCase();
      const titleHit = row.title.toLowerCase().includes(lower);
      const excerptHit = (row.excerpt || '').toLowerCase().includes(lower);
      const score = (titleHit ? 0.6 : 0) + (excerptHit ? 0.3 : 0) + 0.1;
      return {
        article: mapArticle(row),
        score,
        highlights: extractHighlights(row.content, query),
        searchType: 'keyword',
        matchedFields: [titleHit && 'title', excerptHit && 'excerpt', 'content'].filter(Boolean) as string[],
      };
    });
    results.sort((a, b) => b.score - a.score);

    await db.from('kb_search_logs').insert({
      id: `search_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      query,
      result_count: results.length,
      user_id: options.userId,
    });

    if (results.length === 0) {
      await this.recordKnowledgeGap(tenantId, query);
    }
    return results;
  }

  private static async recordKnowledgeGap(tenantId: string, query: string): Promise<void> {
    const { data: existing } = await db
      .from('kb_knowledge_gaps')
      .select('id, request_count, related_search_queries')
      .eq('tenant_id', tenantId)
      .eq('title', `Missing: ${query}`)
      .maybeSingle();
    if (existing) {
      const queries = Array.from(new Set([...(existing.related_search_queries || []), query]));
      await db
        .from('kb_knowledge_gaps')
        .update({ request_count: (existing.request_count || 0) + 1, related_search_queries: queries })
        .eq('id', existing.id);
      return;
    }
    await db.from('kb_knowledge_gaps').insert({
      id: `gap_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      title: `Missing: ${query}`,
      description: `No articles matched the search "${query}".`,
      source: 'search_miss',
      status: 'identified',
      related_search_queries: [query],
    });
  }
}