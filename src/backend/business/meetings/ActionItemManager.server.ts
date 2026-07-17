import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import type { ActionItem, ActionItemStatus } from "./MeetingIntelligenceTypes";

export class ActionItemManager {
  static async updateStatus(actionItemId: string, tenantId: string, status: ActionItemStatus): Promise<void> {
    const updates: Record<string, any> = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    await db.from('meeting_action_items').update(updates).eq('id', actionItemId).eq('tenant_id', tenantId);
  }

  static async assignActionItem(actionItemId: string, tenantId: string, assigneeId: string, assigneeName: string): Promise<void> {
    await db.from('meeting_action_items')
      .update({ assignee_id: assigneeId, assignee_name: assigneeName })
      .eq('id', actionItemId).eq('tenant_id', tenantId);
  }

  static async getMeetingActionItems(meetingId: string, tenantId: string): Promise<ActionItem[]> {
    const { data } = await db.from('meeting_action_items').select('*')
      .eq('meeting_id', meetingId).eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });
    return (data || []).map(mapItem);
  }

  static async getUserActionItems(userId: string, tenantId: string, status?: ActionItemStatus): Promise<ActionItem[]> {
    let q = db.from('meeting_action_items').select('*')
      .eq('tenant_id', tenantId).eq('assignee_id', userId)
      .order('due_date', { ascending: true, nullsFirst: false });
    if (status) q = q.eq('status', status);
    const { data } = await q;
    return (data || []).map(mapItem);
  }
}

function mapItem(r: any): ActionItem {
  return {
    id: r.id, summaryId: r.summary_id, meetingId: r.meeting_id, tenantId: r.tenant_id,
    title: r.title, description: r.description ?? undefined,
    priority: r.priority, status: r.status,
    assigneeId: r.assignee_id ?? undefined, assigneeName: r.assignee_name ?? undefined,
    dueDate: r.due_date ? new Date(r.due_date) : undefined,
    completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
    mentionedAt: r.mentioned_at ?? undefined, context: r.context ?? undefined,
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
  };
}