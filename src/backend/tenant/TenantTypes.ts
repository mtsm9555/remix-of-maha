export type TenantPlan = "free" | "pro" | "enterprise" | "trial";
export type TenantStatus = "active" | "suspended" | "trial" | "cancel_pending";
export type TenantRole = "owner" | "admin" | "member" | "viewer";

export interface TenantConfig {
  maxAgents: number;
  maxMemoryRecords: number;
  allowedModels: string[];
  monthlyBudgetLimitUSD: number;
  customDomain?: string;
  suspensionReason?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  config: TenantConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  userRole: TenantRole;
}