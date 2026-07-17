import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ApprovalPolicy, ApprovalAction, ApprovalCondition, ApprovalType, ApprovalPriority } from "./ApprovalGatesTypes";

function mapPolicy(p: any): ApprovalPolicy {
  return {
    id: p.id,
    tenantId: p.tenant_id,
    workspaceId: p.workspace_id ?? undefined,
    name: p.name,
    description: p.description ?? undefined,
    action: p.action,
    conditions: p.conditions || [],
    approvalType: p.approval_type,
    requiredApprovers: p.required_approvers,
    approverRoles: p.approver_roles || [],
    approverUsers: p.approver_users || [],
    approverHierarchy: p.approver_hierarchy || undefined,
    timeoutMinutes: p.timeout_minutes,
    autoRejectOnTimeout: p.auto_reject_on_timeout,
    notifyApprovers: p.notify_approvers,
    notifyRequester: p.notify_requester,
    notificationChannels: p.notification_channels || [],
    isActive: p.is_active,
    priority: p.priority,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  };
}

export class ApprovalPolicyManager {
  static async createPolicy(
    tenantId: string,
    action: ApprovalAction,
    config: {
      name: string;
      description?: string;
      workspaceId?: string;
      conditions?: ApprovalCondition[];
      approvalType?: ApprovalType;
      requiredApprovers?: number;
      approverRoles?: string[];
      approverUsers?: string[];
      approverHierarchy?: string[];
      timeoutMinutes?: number;
      autoRejectOnTimeout?: boolean;
      notifyApprovers?: boolean;
      notifyRequester?: boolean;
      notificationChannels?: ('email' | 'slack' | 'in_app')[];
      priority?: ApprovalPriority;
    }
  ): Promise<ApprovalPolicy> {
    const id = `policy_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const row = {
      id,
      tenant_id: tenantId,
      workspace_id: config.workspaceId ?? null,
      name: config.name,
      description: config.description ?? null,
      action,
      conditions: config.conditions || [],
      approval_type: config.approvalType || 'single',
      required_approvers: config.requiredApprovers || 1,
      approver_roles: config.approverRoles || [],
      approver_users: config.approverUsers || [],
      approver_hierarchy: config.approverHierarchy || null,
      timeout_minutes: config.timeoutMinutes || 1440,
      auto_reject_on_timeout: config.autoRejectOnTimeout !== false,
      notify_approvers: config.notifyApprovers !== false,
      notify_requester: config.notifyRequester !== false,
      notification_channels: config.notificationChannels || ['email', 'in_app'],
      is_active: true,
      priority: config.priority || 'normal',
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await (supabaseAdmin as any).from('approval_policies').insert(row).select().single();
    if (error) throw error;
    return mapPolicy(data);
  }

  static async requiresApproval(
    tenantId: string,
    action: ApprovalAction,
    context: Record<string, any>,
    workspaceId?: string
  ): Promise<{ required: boolean; policy?: ApprovalPolicy }> {
    let query = (supabaseAdmin as any)
      .from('approval_policies')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('action', action)
      .eq('is_active', true);
    if (workspaceId) query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
    const { data: policies } = await query;
    if (!policies || policies.length === 0) return { required: false };
    for (const p of policies) {
      if (this.evaluateConditions(p.conditions || [], context)) {
        return { required: true, policy: mapPolicy(p) };
      }
    }
    return { required: false };
  }

  private static evaluateConditions(conditions: ApprovalCondition[], context: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true;
    for (const c of conditions) {
      const v = context[c.field];
      switch (c.operator) {
        case 'gt': if (!(v > c.value)) return false; break;
        case 'lt': if (!(v < c.value)) return false; break;
        case 'eq': if (v !== c.value) return false; break;
        case 'neq': if (v === c.value) return false; break;
        case 'in': if (!Array.isArray(c.value) || !c.value.includes(v)) return false; break;
        case 'contains': if (!String(v).includes(c.value)) return false; break;
      }
    }
    return true;
  }

  static async getPolicies(tenantId: string, workspaceId?: string): Promise<ApprovalPolicy[]> {
    let query = (supabaseAdmin as any)
      .from('approval_policies')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (workspaceId) query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);
    const { data } = await query;
    return (data || []).map(mapPolicy);
  }

  static async updatePolicy(policyId: string, updates: Partial<ApprovalPolicy>): Promise<ApprovalPolicy> {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.conditions !== undefined) patch.conditions = updates.conditions;
    if (updates.approvalType !== undefined) patch.approval_type = updates.approvalType;
    if (updates.requiredApprovers !== undefined) patch.required_approvers = updates.requiredApprovers;
    if (updates.approverRoles !== undefined) patch.approver_roles = updates.approverRoles;
    if (updates.approverUsers !== undefined) patch.approver_users = updates.approverUsers;
    if (updates.approverHierarchy !== undefined) patch.approver_hierarchy = updates.approverHierarchy;
    if (updates.timeoutMinutes !== undefined) patch.timeout_minutes = updates.timeoutMinutes;
    if (updates.autoRejectOnTimeout !== undefined) patch.auto_reject_on_timeout = updates.autoRejectOnTimeout;
    if (updates.notifyApprovers !== undefined) patch.notify_approvers = updates.notifyApprovers;
    if (updates.notifyRequester !== undefined) patch.notify_requester = updates.notifyRequester;
    if (updates.notificationChannels !== undefined) patch.notification_channels = updates.notificationChannels;
    if (updates.isActive !== undefined) patch.is_active = updates.isActive;
    if (updates.priority !== undefined) patch.priority = updates.priority;
    const { data, error } = await (supabaseAdmin as any).from('approval_policies').update(patch).eq('id', policyId).select().single();
    if (error) throw error;
    return mapPolicy(data);
  }

  static async deletePolicy(policyId: string): Promise<void> {
    await (supabaseAdmin as any).from('approval_policies').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', policyId);
  }

  static async seedDefaultPolicies(tenantId: string): Promise<void> {
    const defaults: Array<{ action: ApprovalAction; name: string; description: string; conditions: ApprovalCondition[]; approverRoles: string[]; priority: ApprovalPriority; approvalType?: ApprovalType; requiredApprovers?: number }> = [
      { action: 'data.export', name: 'Data Export Approval', description: 'Requires approval for exporting sensitive data', conditions: [{ field: 'recordCount', operator: 'gt', value: 1000 }], approverRoles: ['admin'], priority: 'high' },
      { action: 'secret.access', name: 'Secret Access Approval', description: 'Requires approval for accessing production secrets', conditions: [{ field: 'secretType', operator: 'eq', value: 'production' }], approverRoles: ['admin'], priority: 'critical' },
      { action: 'production.deploy', name: 'Production Deployment Approval', description: 'All production deployments require approval', conditions: [], approverRoles: ['admin'], approvalType: 'multi', requiredApprovers: 2, priority: 'critical' },
    ];
    for (const d of defaults) {
      const { data: existing } = await (supabaseAdmin as any)
        .from('approval_policies')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('action', d.action)
        .eq('name', d.name)
        .maybeSingle();
      if (!existing) await this.createPolicy(tenantId, d.action, d);
    }
  }
}