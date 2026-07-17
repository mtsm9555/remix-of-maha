export type DocumentStatus = 'draft' | 'active' | 'archived' | 'deleted';
export type DocumentType = 'file' | 'image' | 'video' | 'audio' | 'document' | 'spreadsheet' | 'presentation' | 'archive';
export type StorageProvider = 'local' | 's3' | 'gcs' | 'azure_blob';
export type AccessLevel = 'private' | 'team' | 'organization' | 'public';
export type ShareType = 'user' | 'team' | 'public_link' | 'external';
export type ActivityType = 'view' | 'download' | 'edit' | 'share' | 'comment' | 'version_created';

export interface Document {
  id: string;
  tenantId: string;
  name: string;
  originalName: string;
  description?: string;
  type: DocumentType;
  mimeType: string;
  status: DocumentStatus;
  sizeBytes: number;
  storagePath: string;
  storageProvider: StorageProvider;
  folderId?: string;
  tags: string[];
  categories: string[];
  projectId?: string;
  taskId?: string;
  contactId?: string;
  dealId?: string;
  articleId?: string;
  ownerId: string;
  teamId?: string;
  currentVersionId?: string;
  versionCount: number;
  accessLevel: AccessLevel;
  isEncrypted: boolean;
  aiProcessed: boolean;
  extractedText?: string;
  aiTags: string[];
  aiCategory?: string;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  lastAccessedAt?: Date;
  customMetadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  tenantId: string;
  version: number;
  status: 'current' | 'previous' | 'draft';
  sizeBytes: number;
  storagePath: string;
  checksumSha256: string;
  changeSummary?: string;
  changedBy: string;
  createdAt: Date;
}

export interface Folder {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  childIds: string[];
  level: number;
  path: string;
  icon?: string;
  color?: string;
  accessLevel: AccessLevel;
  documentCount: number;
  totalSizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}