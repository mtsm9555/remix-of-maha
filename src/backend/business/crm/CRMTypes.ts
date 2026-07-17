export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned' | 'inactive';
export type DealStage = 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type DealPriority = 'low' | 'medium' | 'high' | 'critical';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'demo' | 'follow_up';
export type ActivityStatus = 'scheduled' | 'completed' | 'cancelled' | 'overdue';

export interface Contact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  companyId?: string;
  status: ContactStatus;
  leadScore?: number;
  lifecycleStage?: string;
  preferredContactMethod?: 'email' | 'phone' | 'sms';
  timezone?: string;
  language?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  tags: string[];
  segments: string[];
  consentGiven: boolean;
  consentDate?: Date;
  doNotContact: boolean;
  source?: string;
  assignedTo?: string;
  lastActivityAt?: Date;
  nextActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'enterprise';
  annualRevenue?: number;
  fundingStage?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  status: 'prospect' | 'customer' | 'partner' | 'churned';
  accountTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalContacts: number;
  totalDeals: number;
  totalRevenue: number;
  lifetimeValue?: number;
  tags: string[];
  segments: string[];
  assignedTo?: string;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  value: number;
  currency: string;
  expectedCloseDate?: Date;
  stage: DealStage;
  probability: number;
  priority: DealPriority;
  companyId?: string;
  contactIds: string[];
  assignedTo?: string;
  teamIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  lostReason?: string;
  pipelineId: string;
  stageEnteredAt: Date;
  tags: string[];
  source?: string;
  campaignId?: string;
  forecastCategory?: 'pipeline' | 'best_case' | 'commit' | 'closed';
  metadata: Record<string, any>;
}

export interface Activity {
  id: string;
  tenantId: string;
  type: ActivityType;
  subject: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  durationMinutes?: number;
  status: ActivityStatus;
  contactIds: string[];
  companyId?: string;
  dealId?: string;
  assignedTo?: string;
  createdBy: string;
  outcome?: string;
  nextSteps?: string;
  tags: string[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color?: string;
  isFinal?: boolean;
  isLost?: boolean;
  autoAdvanceDays?: number;
  requiredFields?: string[];
  dealCount: number;
  totalValue: number;
}

export interface Pipeline {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  isActive: boolean;
  isDefault: boolean;
  totalDeals: number;
  totalValue: number;
  averageDealSize: number;
  winRate: number;
  averageDaysInPipeline: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMMetrics {
  tenantId: string;
  period: string;
  totalContacts: number;
  newContactsThisPeriod: number;
  activeContacts: number;
  totalCompanies: number;
  newCompaniesThisPeriod: number;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalDealValue: number;
  wonDealValue: number;
  winRate: number;
  averageDealSize: number;
  pipelineValue: number;
  weightedPipelineValue: number;
  averageDaysToClose: number;
  totalActivities: number;
  completedActivities: number;
  overdueActivities: number;
  activityCompletionRate: number;
  leadToCustomerRate: number;
  averageTimeToConvert: number;
}