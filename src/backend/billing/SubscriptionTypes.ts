export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus =
  | 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused' | 'incomplete';

export interface PlanQuotas {
  maxAgents: number;
  maxTeamMembers: number;
  maxMemoryRecords: number;
  monthlyBudgetUSD: number;
  maxStorageGB: number;
  allowedModels: string[];
  allowedTools: string[];
}

export interface PlanFeatures {
  customRoles: boolean;
  ssoEnabled: boolean;
  auditLogs: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  whiteLabel: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  monthlyPriceUSD: number;
  yearlyPriceUSD: number;
  stripeMonthlyPriceId?: string | null;
  stripeYearlyPriceId?: string | null;
  quotas: PlanQuotas;
  features: PlanFeatures;
  isActive: boolean;
}

export interface SubscriptionUsage {
  activeAgents: number;
  teamMembers: number;
  memoryRecords: number;
  storageUsedGB: number;
  apiCallsThisMonth: number;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  canceledAt?: Date | null;
  usage: SubscriptionUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageMeter {
  id: string;
  tenantId: string;
  metricName: string;
  value: number;
  periodStart: Date;
  periodEnd: Date;
  recordedAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceUSD: number;
  totalUSD: number;
  type: 'subscription' | 'usage' | 'credit' | 'tax';
}

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId?: string | null;
  stripeInvoiceId?: string | null;
  amountUSD: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  lineItems: InvoiceLineItem[];
  periodStart: Date;
  periodEnd: Date;
  dueDate?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
}