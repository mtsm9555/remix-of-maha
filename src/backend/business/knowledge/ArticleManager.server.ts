import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Article, ArticleStatus, ArticleType, AccessLevel } from "./KnowledgeBaseTypes";

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
    reviewerId: d.reviewer_id ?? undefined,
    lastEditedBy: d.last_edited_by ?? undefined,
    version: d.version,
    previousVersionId: d.previous_version_id ?? undefined,
    publishedAt: d.published_at ? new Date(d.published_at) : undefined,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
    viewCount: d.view_count ?? 0,
    helpfulCount: d.helpful_count ?? 0,
    notHelpfulCount: d.not_helpful_count ?? 0,
    averageRating: d.average_rating ?? 0,
    metaDescription: d.meta_description ?? undefined,
    keywords: d.keywords || [],
    aiGenerated: d.ai_generated ?? false,
    metadata: d.metadata || {},
  };
}

export class ArticleManager {
  static async createArticle(
    tenantId: string,
    data: {
      title: string;
      content: string;
      contentType?: 'text' | 'markdown' | 'html';
      type?: ArticleType;
      status?: ArticleStatus;
      accessLevel?: AccessLevel;
      categoryId?: string;
      tags?: string[];
      excerpt?: string;
      metaDescription?: string;
      keywords?: string[];
      aiGenerated?: boolean;
    },
    authorId: string,
  ): Promise<Article> {
    const slug = await this.generateSlug(tenantId, data.title);
    const id = `article_${crypto.randomUUID()}`;
    const status = data.status || 'draft';
    const row = {
      id,
      tenant_id: tenantId,
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      content_type: data.contentType || 'markdown',
      type: data.type || 'guide',
      status,
      access_level: data.accessLevel || 'internal',
      category_id: data.categoryId,
      tags: data.tags || [],
      author_id: authorId,
      version: 1,
      published_at: status === 'published' ? new Date().toISOString() : null,
      meta_description: data.metaDescription,
      keywords: data.keywords || [],
      ai_generated: !!data.aiGenerated,
    };
    const { data: inserted, error } = await db.from('kb_articles').insert(row).select('*').single();
    if (error) throw error;

    await db.from('kb_article_versions').insert({
      id: `ver_${crypto.randomUUID()}`,
      article_id: id,
      tenant_id: tenantId,
      version: 1,
      title: data.title,
      content: data.content,
      edited_by: authorId,
      edited_at: new Date().toISOString(),
    });

    if (data.categoryId) {
      const { data: cat } = await db.from('kb_categories').select('article_count').eq('id', data.categoryId).single();
      await db.from('kb_categories').update({ article_count: (cat?.article_count || 0) + 1 }).eq('id', data.categoryId);
    }
    return mapArticle(inserted);
  }

  private static async generateSlug(tenantId: string, title: string): Promise<string> {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
    let slug = base;
    let i = 1;
    while (true) {
      const { data } = await db.from('kb_articles').select('id').eq('tenant_id', tenantId).eq('slug', slug).maybeSingle();
      if (!data) return slug;
      slug = `${base}-${++i}`;
    }
  }

  static async updateArticle(
    articleId: string,
    tenantId: string,
    updates: Partial<{ title: string; content: string; excerpt: string; tags: string[]; status: ArticleStatus; categoryId: string; changeSummary: string }>,
    editedBy: string,
  ): Promise<Article> {
    const { data: current } = await db.from('kb_articles').select('*').eq('id', articleId).eq('tenant_id', tenantId).single();
    if (!current) throw new Error('Article not found');
    const nextVersion = current.version + 1;
    const patch: Record<string, any> = { last_edited_by: editedBy, version: nextVersion };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.content !== undefined) patch.content = updates.content;
    if (updates.excerpt !== undefined) patch.excerpt = updates.excerpt;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.categoryId !== undefined) patch.category_id = updates.categoryId;
    if (updates.status !== undefined) {
      patch.status = updates.status;
      if (updates.status === 'published' && !current.published_at) patch.published_at = new Date().toISOString();
    }
    const { data: updated, error } = await db.from('kb_articles').update(patch).eq('id', articleId).select('*').single();
    if (error) throw error;

    await db.from('kb_article_versions').insert({
      id: `ver_${crypto.randomUUID()}`,
      article_id: articleId,
      tenant_id: tenantId,
      version: nextVersion,
      title: updated.title,
      content: updated.content,
      edited_by: editedBy,
      edited_at: new Date().toISOString(),
      change_summary: updates.changeSummary,
    });
    return mapArticle(updated);
  }

  static async getArticle(articleId: string, tenantId: string): Promise<Article | null> {
    const { data } = await db.from('kb_articles').select('*').eq('id', articleId).eq('tenant_id', tenantId).maybeSingle();
    return data ? mapArticle(data) : null;
  }

  static async recordView(articleId: string, tenantId: string, userId?: string): Promise<void> {
    await db.from('kb_article_views').insert({
      id: `view_${crypto.randomUUID()}`,
      article_id: articleId,
      tenant_id: tenantId,
      user_id: userId,
    });
    const { data: art } = await db.from('kb_articles').select('view_count').eq('id', articleId).single();
    await db.from('kb_articles').update({ view_count: (art?.view_count || 0) + 1 }).eq('id', articleId);
  }

  static async submitFeedback(
    articleId: string,
    tenantId: string,
    userId: string,
    type: 'helpful' | 'not_helpful' | 'outdated' | 'inaccurate' | 'incomplete',
    opts: { comment?: string; rating?: number } = {},
  ): Promise<void> {
    await db.from('kb_article_feedback').insert({
      id: `fb_${crypto.randomUUID()}`,
      article_id: articleId,
      tenant_id: tenantId,
      user_id: userId,
      type,
      comment: opts.comment,
      rating: opts.rating,
    });
    if (type === 'helpful' || type === 'not_helpful') {
      const field = type === 'helpful' ? 'helpful_count' : 'not_helpful_count';
      const { data: art } = await db.from('kb_articles').select(field).eq('id', articleId).single();
      await db.from('kb_articles').update({ [field]: (art?.[field] || 0) + 1 }).eq('id', articleId);
    }
  }

  static async listArticles(
    tenantId: string,
    filters: { status?: ArticleStatus; categoryId?: string; tags?: string[]; authorId?: string; limit?: number } = {},
  ): Promise<Article[]> {
    let q = db.from('kb_articles').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.categoryId) q = q.eq('category_id', filters.categoryId);
    if (filters.authorId) q = q.eq('author_id', filters.authorId);
    if (filters.tags?.length) q = q.overlaps('tags', filters.tags);
    if (filters.limit) q = q.limit(filters.limit);
    const { data } = await q;
    return (data || []).map(mapArticle);
  }
}