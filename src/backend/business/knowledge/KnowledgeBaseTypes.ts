export type ArticleStatus = 'draft' | 'review' | 'published' | 'archived';
export type ArticleType = 'how_to' | 'faq' | 'guide' | 'reference' | 'tutorial' | 'policy' | 'announcement';
export type ContentType = 'text' | 'markdown' | 'html' | 'video' | 'interactive';
export type AccessLevel = 'public' | 'internal' | 'restricted' | 'confidential';
export type FeedbackType = 'helpful' | 'not_helpful' | 'outdated' | 'inaccurate' | 'incomplete';

export interface Article {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  contentType: ContentType;
  type: ArticleType;
  status: ArticleStatus;
  accessLevel: AccessLevel;
  categoryId?: string;
  tags: string[];
  relatedArticleIds: string[];
  authorId: string;
  reviewerId?: string;
  lastEditedBy?: string;
  version: number;
  previousVersionId?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  averageRating: number;
  metaDescription?: string;
  keywords: string[];
  aiGenerated: boolean;
  metadata: Record<string, any>;
}

export interface Category {
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
  articleCount: number;
  viewCount: number;
  accessLevel: AccessLevel;
  allowedRoles?: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSearchResult {
  article: Article;
  score: number;
  highlights: string[];
  searchType: 'keyword' | 'semantic' | 'hybrid';
  matchedFields: string[];
}

export interface ArticleFeedback {
  id: string;
  articleId: string;
  tenantId: string;
  userId: string;
  type: FeedbackType;
  comment?: string;
  rating?: number;
  createdAt: Date;
}