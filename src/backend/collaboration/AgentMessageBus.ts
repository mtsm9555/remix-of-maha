import type { AgentMessage } from "./CollaborationTypes";

/**
 * Supabase-backed message bus. Replaces the Redis pub/sub design because the
 * Worker runtime does not support long-lived Redis subscriptions. Messages are
 * persisted to `agent_message_logs`; consumers poll or subscribe via Supabase
 * Realtime on that table.
 */
export class AgentMessageBus {
  static async sendDirectMessage(msg: AgentMessage): Promise<void> {
    if (!msg.receiverId) throw new Error("Receiver ID required for direct message");
    await this.persist(msg);
  }

  static async broadcastToDepartment(msg: AgentMessage): Promise<void> {
    if (!msg.receiverDepartment) throw new Error("Receiver Department required for broadcast");
    await this.persist(msg);
  }

  private static async persist(msg: AgentMessage): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("agent_message_logs").insert({
      id: msg.id,
      sender_id: msg.senderId,
      sender_dept: msg.senderDepartment,
      receiver_id: msg.receiverId ?? null,
      receiver_dept: msg.receiverDepartment ?? null,
      intent: msg.intent,
      payload: msg.payload as never,
      collaboration_id: msg.collaborationId ?? null,
      created_at: msg.timestamp.toISOString(),
    });
  }

  /** Poll a single agent's inbox for messages received after `since`. */
  static async fetchInbox(
    agentId: string,
    since?: Date,
  ): Promise<Array<Record<string, unknown>>> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("agent_message_logs")
      .select("*")
      .eq("receiver_id", agentId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (since) query = query.gte("created_at", since.toISOString());
    const { data } = await query;
    return data ?? [];
  }
}