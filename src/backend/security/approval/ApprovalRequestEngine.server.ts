import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ApprovalRequest, ApprovalPolicy, ApprovalAssignment, ApprovalDecision, ApprovalAction, ApprovalPriority } from "./ApprovalGatesTypes";
import { ApprovalPolicyManager } from "./ApprovalPolicyManager.server";
import { ApprovalNotificationService } from "./ApprovalNotificationService.server";

function mapRequest(r: any): ApprovalRequest {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    workspaceId: r.workspace_id ?? undefined,
    policyId: r.policy_id,
    action: r.action,
    priority: r.priority,
    requestedBy: r.requested_by,
    requestedAt: new Date(r.requested_at),
    targetResourceType: r.target_resource_type ?? undefined,
    targetResourceId: r.target_resource_id ?? undefined,
    targetResourceName: r.target_resource_name ?? undefined,
    requestData: r.request_data || {},
    justification: r.justification,
    status: r.status,
    assignedApprovers: r.assigned_approvers || [],
    currentApproverIndex: r.current_approver_index || 0,
    decisions: r.decisions || [],
    expiresAt: new Date(r.expires_at),
    approvedAt: r.approved_at ? new Date(r.approved_at) : undefined,
    rejectedAt: r.rejected_at ? new Date(r.rejected_at) : undefined,
    executedAt: r.executed_at ? new Date(r.executed_at) : undefined,
    executedBy: r.executed_by ?? undefined,
    executionResult: r.execution_result ?? undefined,
    metadata: r.metadata || {},
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export class ApprovalRequestEngine {
  static async createRequest(
    tenantId: string,
    action: ApprovalAction,
    requestedBy: string,
    requestData: Record<string, any>,
    justification: string,
    options: {
      workspaceId?: string;
      targetResourceType?: string;
      targetResourceId?: string;
      targetResourceName?: string;
      priority?: ApprovalPriority;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<ApprovalRequest> {
    const { required, policy } = await ApprovalPolicyManager.requiresApproval(tenantId, action, requestData, options.workspaceId);
    if (!required || !policy) throw new Error('No approval policy matches this request');

    const id = `req_${crypto.randomUUID()}`;
    const now = new Date();
    const expiresAt = new Date(Date.now() + policy.timeoutMinutes * 60 * 1000);
    const row: any = {
      id,
      tenant_id: tenantId,
      workspace_id: options.workspaceId ?? null,
      policy_id: policy.id,
      action,
      priority: options.priority || policy.priority,
      requested_by: requestedBy,
      requested_at: now.toISOString(),
      target_resource_type: options.targetResourceType ?? null,
      target_resource_id: options.targetResourceId ?? null,
      target_resource_name: options.targetResourceName ?? null,
      request_data: requestData,
      justification,
      status: 'pending',
      assigned_approvers: [],
      current_approver_index: 0,
      decisions: [],
      expires_at: expiresAt.toISOString(),
      metadata: options.metadata || {},
    };
    const { data, error } = await (supabaseAdmin as any).from('approval_requests').insert(row).select().single();
    if (error) throw error;
    const request = mapRequest(data);
    await this.assignApprovers(request, policy);
    if (policy.notifyApprovers) await ApprovalNotificationService.notifyApprovers(request, policy);
    return request;
  }

  private static async assignApprovers(request: ApprovalRequest, policy: ApprovalPolicy): Promise<void> {
    const assignments: ApprovalAssignment[] = [];
    const push = (approverId: string) => assignments.push({
      id: `assign_${crypto.randomUUID()}`,
      requestId: request.id,
      approverId,
      assignedAt: new Date(),
      status: 'pending',
    });

    switch (policy.approvalType) {
      case 'single': {
        const a = await this.selectApprover(policy);
        if (a) push(a);
        break;
      }
      case 'multi': {
        for (let i = 0; i < policy.requiredApprovers; i++) {
          const a = await this.selectApprover(policy, assignments.map(x => x.approverId));
          if (a) push(a);
        }
        break;
      }
      case 'hierarchical': {
        if (policy.approverHierarchy) for (const a of policy.approverHierarchy) push(a);
        break;
      }
      case 'quorum': {
        const eligible = await this.getEligibleApprovers(policy);
        for (const a of eligible) push(a);
        break;
      }
    }

    for (const a of assignments) {
      await (supabaseAdmin as any).from('approval_assignments').insert({
        id: a.id,
        request_id: a.requestId,
        approver_id: a.approverId,
        assigned_at: a.assignedAt.toISOString(),
        status: a.status,
      });
    }
    request.assignedApprovers = assignments;
    await (supabaseAdmin as any)
      .from('approval_requests')
      .update({
        assigned_approvers: assignments.map(a => ({
          id: a.id, request_id: a.requestId, approver_id: a.approverId,
          assigned_at: a.assignedAt.toISOString(), status: a.status,
        })),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);
  }

  private static async selectApprover(policy: ApprovalPolicy, excludeIds: string[] = []): Promise<string | null> {
    if (policy.approverUsers.length > 0) {
      return policy.approverUsers.find(id => !excludeIds.includes(id)) || null;
    }
    if (policy.approverRoles.length > 0) {
      const { data } = await (supabaseAdmin as any)
        .from('rbac_role_assignments')
        .select('user_id')
        .eq('tenant_id', policy.tenantId)
        .in('role_id', policy.approverRoles);
      const ids = (data || []).map((x: any) => x.user_id).filter((id: string) => !excludeIds.includes(id));
      return ids[0] || null;
    }
    return null;
  }

  private static async getEligibleApprovers(policy: ApprovalPolicy): Promise<string[]> {
    if (policy.approverUsers.length > 0) return policy.approverUsers;
    if (policy.approverRoles.length > 0) {
      const { data } = await (supabaseAdmin as any)
        .from('rbac_role_assignments')
        .select('user_id')
        .eq('tenant_id', policy.tenantId)
        .in('role_id', policy.approverRoles);
      return (data || []).map((x: any) => x.user_id);
    }
    return [];
  }

  static async submitDecision(
    requestId: string,
    approverId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<ApprovalRequest> {
    const { data: raw } = await (supabaseAdmin as any)
      .from('approval_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .maybeSingle();
    if (!raw) throw new Error('Request not found or not pending');

    const assignments: any[] = raw.assigned_approvers || [];
    const assignment = assignments.find(a => (a.approver_id || a.approverId) === approverId && a.status === 'pending');
    if (!assignment) throw new Error('You are not assigned to approve this request');

    const approvalDecision: ApprovalDecision = {
      id: `decision_${crypto.randomUUID()}`,
      requestId,
      approverId,
      decision,
      comments,
      decidedAt: new Date(),
      metadata: {},
    };
    await (supabaseAdmin as any).from('approval_decisions').insert({
      id: approvalDecision.id,
      request_id: approvalDecision.requestId,
      approver_id: approvalDecision.approverId,
      decision: approvalDecision.decision,
      comments: approvalDecision.comments ?? null,
      decided_at: approvalDecision.decidedAt.toISOString(),
      metadata: approvalDecision.metadata,
    });
    await (supabaseAdmin as any)
      .from('approval_assignments')
      .update({ status: decision, responded_at: new Date().toISOString(), decision: approvalDecision })
      .eq('id', assignment.id);

    const decisions = [...(raw.decisions || []), approvalDecision];
    const { data: policy } = await (supabaseAdmin as any).from('approval_policies').select('*').eq('id', raw.policy_id).single();

    let newStatus: string = raw.status;
    if (policy) {
      switch (policy.approval_type) {
        case 'single':
          newStatus = decision; break;
        case 'multi': {
          const approved = decisions.filter(d => d.decision === 'approved').length;
          if (approved >= policy.required_approvers) newStatus = 'approved';
          else if (decisions.some(d => d.decision === 'rejected')) newStatus = 'rejected';
          break;
        }
        case 'hierarchical': {
          if (decision === 'rejected') newStatus = 'rejected';
          else {
            const next = (raw.current_approver_index || 0) + 1;
            if (next >= assignments.length) newStatus = 'approved';
            else await (supabaseAdmin as any).from('approval_requests').update({ current_approver_index: next }).eq('id', requestId);
          }
          break;
        }
        case 'quorum': {
          const approved = decisions.filter(d => d.decision === 'approved').length;
          if (approved >= policy.required_approvers) newStatus = 'approved';
          break;
        }
      }
    }

    await (supabaseAdmin as any).from('approval_requests').update({
      decisions,
      status: newStatus,
      approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
      rejected_at: newStatus === 'rejected' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', requestId);

    const { data: updated } = await (supabaseAdmin as any).from('approval_requests').select('*').eq('id', requestId).single();
    const finalRequest = mapRequest(updated);
    if (newStatus === 'approved' || newStatus === 'rejected') {
      await ApprovalNotificationService.notifyRequester(finalRequest, newStatus);
    }
    return finalRequest;
  }

  static async getPendingRequests(approverId: string, tenantId: string): Promise<ApprovalRequest[]> {
    const { data } = await (supabaseAdmin as any)
      .from('approval_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });
    return (data || [])
      .filter((r: any) => (r.assigned_approvers || []).some((a: any) => (a.approver_id || a.approverId) === approverId && a.status === 'pending'))
      .map(mapRequest);
  }

  static async getRequestHistory(userId: string, tenantId: string, limit: number = 50): Promise<ApprovalRequest[]> {
    const { data } = await (supabaseAdmin as any)
      .from('approval_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('requested_by', userId)
      .order('requested_at', { ascending: false })
      .limit(limit);
    return (data || []).map(mapRequest);
  }

  static async cancelRequest(requestId: string, cancelledBy: string): Promise<void> {
    await (supabaseAdmin as any)
      .from('approval_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('requested_by', cancelledBy)
      .eq('status', 'pending');
  }

  static async expireOldRequests(): Promise<number> {
    const { data: expired } = await (supabaseAdmin as any)
      .from('approval_requests')
      .select('id, policy_id')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());
    if (!expired || expired.length === 0) return 0;
    for (const r of expired) {
      const { data: p } = await (supabaseAdmin as any).from('approval_policies').select('auto_reject_on_timeout').eq('id', r.policy_id).maybeSingle();
      const newStatus = p?.auto_reject_on_timeout ? 'rejected' : 'expired';
      await (supabaseAdmin as any).from('approval_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', r.id);
    }
    return expired.length;
  }
}