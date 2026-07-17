import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import type { Folder, AccessLevel } from "./DocumentTypes";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'folder';
}

function mapFolder(r: any): Folder {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name, slug: r.slug,
    description: r.description ?? undefined,
    parentId: r.parent_id ?? undefined,
    childIds: r.child_ids || [], level: r.level ?? 0, path: r.path,
    icon: r.icon ?? undefined, color: r.color ?? undefined,
    accessLevel: r.access_level as AccessLevel,
    documentCount: r.document_count ?? 0, totalSizeBytes: r.total_size_bytes ?? 0,
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
  };
}

export class FolderManager {
  static async createFolder(
    tenantId: string,
    data: { name: string; parentId?: string; description?: string; accessLevel?: AccessLevel; icon?: string; color?: string },
  ): Promise<Folder> {
    let level = 0;
    let path = `/${slugify(data.name)}`;
    if (data.parentId) {
      const { data: parent } = await db.from('doc_folders').select('level, path').eq('id', data.parentId).eq('tenant_id', tenantId).single();
      if (parent) { level = (parent.level ?? 0) + 1; path = `${parent.path}/${slugify(data.name)}`; }
    }
    const row = {
      id: `folder_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      name: data.name,
      slug: slugify(`${data.name}-${Date.now().toString(36)}`),
      description: data.description,
      parent_id: data.parentId,
      level, path,
      icon: data.icon, color: data.color,
      access_level: data.accessLevel || 'private',
    };
    const { data: inserted, error } = await db.from('doc_folders').insert(row).select('*').single();
    if (error) throw error;
    return mapFolder(inserted);
  }

  static async getFolder(id: string, tenantId: string): Promise<Folder | null> {
    const { data } = await db.from('doc_folders').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle();
    return data ? mapFolder(data) : null;
  }

  static async listFolders(tenantId: string, parentId?: string): Promise<Folder[]> {
    let q = db.from('doc_folders').select('*').eq('tenant_id', tenantId).order('name');
    q = parentId ? q.eq('parent_id', parentId) : q.is('parent_id', null);
    const { data } = await q;
    return (data || []).map(mapFolder);
  }
}