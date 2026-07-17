import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ApprovalRequest, ApprovalPolicy, ApprovalNotification } from "./ApprovalGatesTypes";

export class ApprovalNotificationService {
  static async notifyApprovers(request: ApprovalRequest, policy: ApprovalPolicy): Promise<void> {
    for (const assignment of request.assignedApprovers) {
      if (assignment.status !== 'pending') continue;
      const notification: ApprovalNotification = {
        id: `notif_${crypto.randomUUID()}`,
        requestId: request.id,
        recipientId: assignment.approverId,
        type: 'approval_requested',
        channel: 'in_app',
        sentAt: new Date(),
        content: {
          title: `Approval Required: ${policy.name}`,
          message: `${request.requestedBy} is requesting approval for ${request.action}. Justification: ${request.justification}`,
          actionUrl: `/approvals/${request.id}`,
        },
      };
      await (supabaseAdmin as any).from('approval_notifications').insert({
        id: notification.id,
        request_id: notification.requestId,
        recipient_id: notification.recipientId,
        type: notification.type,
        channel: notification.channel,
        sent_at: notification.sentAt.toISOString(),
        content: notification.content,
      });
      if (policy.notificationChannels.includes('email')) {
        console.log(`[ApprovalNotification] Email → ${assignment.approverId}: ${notification.content.title}`);
      }
      if (policy.notificationChannels.includes('slack')) {
        console.log(`[ApprovalNotification] Slack → ${assignment.approverId}: ${notification.content.title}`);
      }
    }
  }

  static async notifyRequester(request: ApprovalRequest, status: string): Promise<void> {
    const statusText = status === 'approved' ? 'Approved' : 'Rejected';
    const notification: ApprovalNotification = {
      id: `notif_${crypto.randomUUID()}`,
      requestId: request.id,
      recipientId: request.requestedBy,
      type: 'approval_received',
      channel: 'in_app',
      sentAt: new Date(),
      content: {
        title: `Request ${statusText}: ${request.action}`,
        message: `Your approval request for ${request.action} has been ${status.toLowerCase()}.`,
        actionUrl: `/approvals/${request.id}`,
      },
    };
    await (supabaseAdmin as any).from('approval_notifications').insert({
      id: notification.id,
      request_id: notification.requestId,
      recipient_id: notification.recipientId,
      type: notification.type,
      channel: notification.channel,
      sent_at: notification.sentAt.toISOString(),
      content: notification.content,
    });
  }

  static async getUserNotifications(userId: string, limit: number = 50): Promise<ApprovalNotification[]> {
    const { data } = await (supabaseAdmin as any)
      .from('approval_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);
    return (data || []).map((n: any) => ({
      id: n.id,
      requestId: n.request_id,
      recipientId: n.recipient_id,
      type: n.type,
      channel: n.channel,
      sentAt: new Date(n.sent_at),
      readAt: n.read_at ? new Date(n.read_at) : undefined,
      content: n.content,
    }));
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await (supabaseAdmin as any).from('approval_notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId);
  }
}