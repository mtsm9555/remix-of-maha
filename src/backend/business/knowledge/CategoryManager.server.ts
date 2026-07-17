import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Category, AccessLevel } from "./KnowledgeBaseTypes";

const db = supabaseAdmin as any;

function mapCategory(d: any): Category {
  return {
    id: d.id,
    tenantId: d.tenant_id,
    name: d.name,
    slug: d.slug,
    description: d.description ?? undefined,
    parentId: d.parent_id ?? undefined,
    childIds: d.child_ids || [],
    level: d.level ?? 0,
    path: d.path,
    icon: d.icon ?? undefined,
    color: d.color ?? undefined,
    articleCount: d.article_count ?? 0,
    viewCount: d.view_count ?? 0,
    accessLevel: d.access_level,
    allowedRoles: d.allowed_roles ?? undefined,
    order: d.sort_order ?? 0,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
  };
}

export class CategoryManager {
  static async createCategory(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      parentId?: string;
      icon?: string;
      color?: string;
      accessLevel?: AccessLevel;
      allowedRoles?: string[];
    },
  ): Promise<Category> {
    const slug = await this.generateSlug(tenantId, data.name);
    let level = 0;
    let path = `/${slug}`;
    if (data.parentId) {
      const { data: parent } = await db.from('kb_categories').select('level, path, child_ids').eq('id', data.parentId).single();
      if (parent) {
        level = (parent.level || 0) + 1;
        path = `${parent.path}/${slug}`;
      }
    }
    const id = `category_${crypto.randomUUID()}`;
    const row = {
      id,
      tenant_id: tenantId,
      name: data.name,
      slug,
      description: data.description,
      parent_id: data.parentId,
      level,
      path,
      icon: data.icon,
      color: data.color,
      access_level: data.accessLevel || 'internal',
      allowed_roles: data.allowedRoles,
    };
    const { data: inserted, error } = await db.from('kb_categories').insert(row).select('*').single();
    if (error) throw error;

    if (data.parentId) {
      const { data: parent } = await db.from('kb_categories').select('child_ids').eq('id', data.parentId).single();
      const next = [...((parent?.child_ids as string[]) || []), id];
      await db.from('kb_categories').update({ child_ids: next }).eq('id', data.parentId);
    }
    return mapCategory(inserted);
  }

  private static async generateSlug(tenantId: string, name: string): Promise<string> {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
    let slug = base;
    let i = 1;
    while (true) {
      const { data } = await db.from('kb_categories').select('id').eq('tenant_id', tenantId).eq('slug', slug).maybeSingle();
      if (!data) return slug;
      slug = `${base}-${++i}`;
    }
  }

  static async getCategoryTree(tenantId: string): Promise<Category[]> {
    const { data } = await db.from('kb_categories').select('*').eq('tenant_id', tenantId).order('path', { ascending: true });
    return (data || []).map(mapCategory);
  }

  static async getCategory(id: string, tenantId: string): Promise<Category | null> {
    const { data } = await db.from('kb_categories').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle();
    return data ? mapCategory(data) : null;
  }
}