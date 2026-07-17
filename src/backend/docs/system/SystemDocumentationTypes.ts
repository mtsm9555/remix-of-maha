export type DocCategory = 'architecture' | 'deployment' | 'developer' | 'operations' | 'security' | 'user_guide' | 'integration' | 'api_reference';
export type DocFormat = 'markdown' | 'html' | 'pdf' | 'asciidoc';
export type DiagramType = 'architecture' | 'data_flow' | 'sequence' | 'erd' | 'deployment' | 'component';
export type DocStatus = 'draft' | 'review' | 'published' | 'deprecated';
export type AccessLevel = 'public' | 'internal' | 'restricted' | 'confidential';

export interface DocMetadata {
  author: string;
  contributors: string[];
  reviewers: string[];
  systemVersion: string;
  lastUpdated: Date;
  nextReviewDate?: Date;
  prerequisites: string[];
  relatedSystems: string[];
  customFields: Record<string, any>;
}

export interface DocDiagram {
  id: string;
  docId: string;
  type: DiagramType;
  title: string;
  description?: string;
  data: any;
  renderedSvg?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemDocumentation {
  id: string;
  tenantId: string;
  title: string;
  version: string;
  category: DocCategory;
  status: DocStatus;
  accessLevel: AccessLevel;
  content: string;
  metadata: DocMetadata;
  parentId?: string;
  childIds: string[];
  relatedDocIds: string[];
  tags: string[];
  keywords: string[];
  diagrams: DocDiagram[];
  revision: number;
  lastEditedBy: string;
  viewCount: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface DocSearchResult {
  doc: SystemDocumentation;
  score: number;
  highlights: string[];
  matchedFields: string[];
}

export interface DocExport {
  format: DocFormat;
  content: string;
  filename: string;
}

export interface DocAnalytics {
  totalDocs: number;
  publishedDocs: number;
  totalViews: number;
  totalHelpful: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}