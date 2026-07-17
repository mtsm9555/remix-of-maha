import type { TeamChannel, TeamMessage } from "./AdvancedTeamTypes";

export class TeamCollaborationEngine {
  static async createChannel(
    teamId: string,
    name: string,
    type: TeamChannel["type"],
    description: string,
    memberIds: string[] = [],
  ): Promise<TeamChannel> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `chan_${crypto.randomUUID()}`;
    const finalMembers = type === "private" ? memberIds : [];
    const { error } = await supabaseAdmin.from("team_channels" as never).insert({
      id, team_id: teamId, name, type, description, member_ids: finalMembers,
    } as never);
    if (error) throw new Error(error.message);
    return {
      id, teamId, name, type, description,
      memberIds: finalMembers, messageCount: 0, createdAt: new Date(),
    };
  }

  static async postMessage(
    channelId: string,
    senderId: string,
    senderName: string,
    content: string,
    attachments: string[] = [],
    mentions: string[] = [],
    replyToId?: string,
  ): Promise<TeamMessage> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `msg_${crypto.randomUUID()}`;
    const { error } = await supabaseAdmin.from("team_messages" as never).insert({
      id, channel_id: channelId, sender_id: senderId, sender_name: senderName,
      content, attachments, mentions, reply_to_id: replyToId ?? null,
    } as never);
    if (error) throw new Error(error.message);

    const { data: chan } = await supabaseAdmin
      .from("team_channels" as never)
      .select("message_count")
      .eq("id", channelId)
      .single();
    const nextCount = ((chan as { message_count?: number } | null)?.message_count ?? 0) + 1;
    await supabaseAdmin
      .from("team_channels" as never)
      .update({ message_count: nextCount, last_message_at: new Date().toISOString() } as never)
      .eq("id", channelId);

    return {
      id, channelId, senderId, senderName, content, attachments, mentions,
      replyToId, reactions: {}, createdAt: new Date(),
    };
  }

  static async getChannelMessages(
    channelId: string,
    limit = 50,
    before?: Date,
  ): Promise<TeamMessage[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("team_messages" as never)
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (before) q = q.lt("created_at", before.toISOString());
    const { data } = await q;
    return ((data ?? []) as unknown as TeamMessage[]);
  }

  static async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: message } = await supabaseAdmin
      .from("team_messages" as never)
      .select("reactions")
      .eq("id", messageId)
      .single();
    if (!message) throw new Error("Message not found");
    const reactions = { ...(((message as { reactions?: Record<string, string[]> } | null)?.reactions) ?? {}) };
    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(userId)) reactions[emoji].push(userId);
    await supabaseAdmin
      .from("team_messages" as never)
      .update({ reactions } as never)
      .eq("id", messageId);
  }

  static async getTeamChannels(teamId: string, userId: string): Promise<TeamChannel[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("team_channels" as never)
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });
    return ((data ?? []) as unknown as Array<TeamChannel & { member_ids?: string[] }>).filter(
      (c) => c.type !== "private" || (c.memberIds ?? c.member_ids ?? []).includes(userId),
    );
  }
}