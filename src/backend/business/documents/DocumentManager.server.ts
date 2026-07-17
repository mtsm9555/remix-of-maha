import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import type { Document, DocumentStatus, DocumentType, StorageProvider, AccessLevel, ActivityType } from "./DocumentTypes";

function mapDoc(r: any): Document {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name, originalName: r.original_name,
    description: r.description ?? undefined, type: r.type, mimeType: r.mime_type, status: r.status,
    sizeBytes: Number(r.size_bytes), storagePath: r.storage_path, storageProvider: r.storage_provider,
    folderId: r.folder_id ?? undefined, tags: r.tags || [], categories: r.categories || [],
    projectId: r.project_id ?? undefined, taskId: r.task_id ?? undefined,
    contactId: r.contact_id ?? undefined, dealId: r.deal_id ?? undefined,
    articleId: r.article_id ?? undefined,
    ownerId: r.owner_id, teamId: r.team_id ?? undefined,
    currentVersionId: r.current_version_id ?? undefined, versionCount: r.version_count ?? 1,
    accessLevel: r.access_level, isEncrypted: !!r.is_encrypted,
    aiProcessed: !!r.ai_processed, extractedText: r.extracted_text ?? undefined,
    aiTags: r.ai_tags || [], aiCategory: r.ai_category ?? undefined,
    viewCount: r.view_count ?? 0, downloadCount: r.download_count ?? 0, shareCount: r.share_count ?? 0,
    lastAccessedAt: r.last_accessed_at ? new Date(r.last_accessed_at) : undefined,
    customMetadata: r.custom_metadata || {},
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
    deletedAt: r.deleted_at ? new Date(r.deleted_at) : undefined,
  };
}

export class DocumentManager {
  static async createDocument(
    tenantId: string,
    data: {
      name: string;
      originalName: string;
      type: DocumentType;
      mimeType: string;
      sizeBytes: number;
      storagePath: string;
      storageProvider?: StorageProvider;
      folderId?: string;
      tags?: string[];
      accessLevel?: AccessLevel;
      projectId?: string;
      dealId?: string;
      contactId?: string;
      description?: string;
    },
    ownerId: string,
  ): Promise<Document> {
    const id = `doc_${crypto.randomUUID()}`;
    const versionId = `docver_${crypto.randomUUID()}`;
    const row = {
      id, tenant_id: tenantId,
      name: data.name, original_name: data.originalName, description: data.description,
      type: data.type, mime_type: data.mimeType, status: 'active',
      size_bytes: data.sizeBytes, storage_path: data.storagePath,
      storage_provider: data.storageProvider || 'local',
      folder_id: data.folderId, tags: data.tags || [],
      project_id: data.projectId, deal_id: data.dealId, contact_id: data.contactId,
      owner_id: ownerId, access_level: data.accessLevel || 'private',
      current_version_id: versionId, version_count: 1,
    };
    const { data: inserted, error } = await db.from('doc_documents').insert(row).select('*').single();
    if (error) throw error;
    await db.from('doc_versions').insert({
      id: versionId, document_id: id, tenant_id: tenantId,
      version: 1, status: 'current', size_bytes: data.sizeBytes,
      storage_path: data.storagePath, checksum_sha256: '', changed_by: ownerId,
    });
    return mapDoc(inserted);
  }

  static async addVersion(
    documentId: string,
    tenantId: string,
    data: { sizeBytes: number; storagePath: string; checksumSha256: string; changeSummary?: string },
    changedBy: string,
  ): Promise<void> {
    const { data: doc } = await db.from('doc_documents').select('version_count').eq('id', documentId).eq('tenant_id', tenantId).single();
    if (!doc) throw new Error('Document not found');
    const nextVersion = (doc.version_count || 1) + 1;
    const versionId = `docver_${crypto.randomUUID()}`;
    await db.from('doc_versions').update({ status: 'previous' }).eq('document_id', documentId).eq('status', 'current');
    await db.from('doc_versions').insert({
      id: versionId, document_id: documentId, tenant_id: tenantId,
      version: nextVersion, status: 'current',
      size_bytes: data.sizeBytes, storage_path: data.storagePath,
      checksum_sha256: data.checksumSha256, change_summary: data.changeSummary,
      changed_by: changedBy,
    });
    await db.from('doc_documents').update({
      current_version_id: versionId, version_count: nextVersion,
      size_bytes: data.sizeBytes, storage_path: data.storagePath,
    }).eq('id', documentId);
    await this.logActivity(documentId, tenantId, changedBy, 'version_created');
  }

  static async getDocument(id: string, tenantId: string): Promise<Document | null> {
    const { data } = await db.from('doc_documents').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle();
    return data ? mapDoc(data) : null;
  }

  static async listDocuments(
    tenantId: string,
    filters: { folderId?: string; ownerId?: string; status?: DocumentStatus; tags?: string[]; limit?: number } = {},
  ): Promise<Document[]> {
    let q = db.from('doc_documents').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
    q = filters.status ? q.eq('status', filters.status) : q.neq('status', 'deleted');
    if (filters.folderId) q = q.eq('folder_id', filters.folderId);
    if (filters.ownerId) q = q.eq('owner_id', filters.ownerId);
    if (filters.tags?.length) q = q.overlaps('tags', filters.tags);
    if (filters.limit) q = q.limit(filters.limit);
    const { data } = await q;
    return (data || []).map(mapDoc);
  }

  static async softDelete(id: string, tenantId: string): Promise<void> {
    await db.from('doc_documents').update({
      status: 'deleted', deleted_at: new Date().toISOString(),
    }).eq('id', id).eq('tenant_id', tenantId);
  }

  static async logActivity(documentId: string, tenantId: string, userId: string, type: ActivityType, details?: Record<string, any>): Promise<void> {
    await db.from('doc_activities').insert({
      id: `docact_${crypto.randomUUID()}`,
      document_id: documentId, tenant_id: tenantId,
      user_id: userId, activity_type: type, details: (details || {}) as any,
    });
    if (type === 'view') {
      const { data } = await db.from('doc_documents').select('view_count').eq('id', documentId).single();
      await db.from('doc_documents').update({
        view_count: (data?.view_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      }).eq('id', documentId);
    } else if (type === 'download') {
      const { data } = await db.from('doc_documents').select('download_count').eq('id', documentId).single();
      await db.from('doc_documents').update({ download_count: (data?.download_count || 0) + 1 }).eq('id', documentId);
    }
  }
}