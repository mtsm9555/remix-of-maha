import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import type { Meeting, MeetingStatus, MeetingType, ExternalParticipant } from "./MeetingIntelligenceTypes";

function mapToMeeting(data: any): Meeting {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    title: data.title,
    description: data.description ?? undefined,
    type: data.type,
    status: data.status,
    scheduledStart: new Date(data.scheduled_start),
    scheduledEnd: new Date(data.scheduled_end),
    actualStart: data.actual_start ? new Date(data.actual_start) : undefined,
    actualEnd: data.actual_end ? new Date(data.actual_end) : undefined,
    durationMinutes: data.duration_minutes ?? 0,
    location: data.location ?? undefined,
    meetingUrl: data.meeting_url ?? undefined,
    isVirtual: !!data.is_virtual,
    organizerId: data.organizer_id,
    participantIds: data.participant_ids || [],
    externalParticipants: data.external_participants || [],
    projectId: data.project_id ?? undefined,
    dealId: data.deal_id ?? undefined,
    contactId: data.contact_id ?? undefined,
    calendarEventId: data.calendar_event_id ?? undefined,
    isRecorded: !!data.is_recorded,
    recordingUrl: data.recording_url ?? undefined,
    recordingDurationSeconds: data.recording_duration_seconds ?? undefined,
    transcriptStatus: data.transcript_status || 'pending',
    transcriptId: data.transcript_id ?? undefined,
    summaryId: data.summary_id ?? undefined,
    aiProcessed: !!data.ai_processed,
    actionItemCount: data.action_item_count ?? 0,
    decisionCount: data.decision_count ?? 0,
    followUpCount: data.follow_up_count ?? 0,
    tags: data.tags || [],
    metadata: data.metadata || {},
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export class MeetingManager {
  static async scheduleMeeting(
    tenantId: string,
    data: {
      title: string;
      description?: string;
      type: MeetingType;
      scheduledStart: Date;
      scheduledEnd: Date;
      location?: string;
      meetingUrl?: string;
      isVirtual?: boolean;
      participantIds?: string[];
      externalParticipants?: ExternalParticipant[];
      projectId?: string;
      dealId?: string;
      contactId?: string;
      isRecorded?: boolean;
      tags?: string[];
    },
    organizerId: string,
  ): Promise<Meeting> {
    const durationMinutes = Math.round(
      (data.scheduledEnd.getTime() - data.scheduledStart.getTime()) / 60000,
    );
    const row = {
      id: `meeting_${crypto.randomUUID()}`,
      tenant_id: tenantId,
      title: data.title,
      description: data.description,
      type: data.type,
      status: 'scheduled',
      scheduled_start: data.scheduledStart.toISOString(),
      scheduled_end: data.scheduledEnd.toISOString(),
      duration_minutes: durationMinutes,
      location: data.location,
      meeting_url: data.meetingUrl,
      is_virtual: data.isVirtual ?? !!data.meetingUrl,
      organizer_id: organizerId,
      participant_ids: data.participantIds || [organizerId],
      external_participants: (data.externalParticipants || []) as any,
      project_id: data.projectId,
      deal_id: data.dealId,
      contact_id: data.contactId,
      is_recorded: data.isRecorded || false,
      transcript_status: 'pending',
      ai_processed: false,
      tags: data.tags || [],
      metadata: {},
    };
    const { data: inserted, error } = await db.from('meetings').insert(row).select('*').single();
    if (error) throw error;
    return mapToMeeting(inserted);
  }

  static async startMeeting(meetingId: string, tenantId: string): Promise<Meeting> {
    const { data, error } = await db
      .from('meetings')
      .update({ status: 'in_progress', actual_start: new Date().toISOString() })
      .eq('id', meetingId).eq('tenant_id', tenantId).select('*').single();
    if (error) throw error;
    return mapToMeeting(data);
  }

  static async endMeeting(meetingId: string, tenantId: string): Promise<Meeting> {
    const { data: existing } = await db.from('meetings').select('*').eq('id', meetingId).eq('tenant_id', tenantId).single();
    if (!existing) throw new Error('Meeting not found');
    const end = new Date();
    const start = existing.actual_start ? new Date(existing.actual_start) : new Date(existing.scheduled_start);
    const dur = Math.round((end.getTime() - start.getTime()) / 60000);
    const { data, error } = await db.from('meetings')
      .update({ status: 'completed', actual_end: end.toISOString(), duration_minutes: dur })
      .eq('id', meetingId).select('*').single();
    if (error) throw error;
    return mapToMeeting(data);
  }

  static async cancelMeeting(meetingId: string, tenantId: string, reason?: string): Promise<void> {
    const { data: existing } = await db.from('meetings').select('metadata').eq('id', meetingId).eq('tenant_id', tenantId).single();
    const existingMeta = (existing?.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata))
      ? (existing.metadata as Record<string, any>)
      : {};
    const metadata = { ...existingMeta, cancellationReason: reason || 'Not specified' };
    await db.from('meetings').update({ status: 'cancelled', metadata }).eq('id', meetingId).eq('tenant_id', tenantId);
  }

  static async getMeeting(meetingId: string, tenantId: string): Promise<Meeting | null> {
    const { data } = await db.from('meetings').select('*').eq('id', meetingId).eq('tenant_id', tenantId).maybeSingle();
    return data ? mapToMeeting(data) : null;
  }

  static async getMeetings(
    tenantId: string,
    filters: {
      status?: MeetingStatus;
      type?: MeetingType;
      organizerId?: string;
      participantId?: string;
      projectId?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    } = {},
  ): Promise<Meeting[]> {
    let q = db.from('meetings').select('*').eq('tenant_id', tenantId).order('scheduled_start', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.type) q = q.eq('type', filters.type);
    if (filters.organizerId) q = q.eq('organizer_id', filters.organizerId);
    if (filters.participantId) q = q.contains('participant_ids', [filters.participantId]);
    if (filters.projectId) q = q.eq('project_id', filters.projectId);
    if (filters.fromDate) q = q.gte('scheduled_start', filters.fromDate.toISOString());
    if (filters.toDate) q = q.lte('scheduled_start', filters.toDate.toISOString());
    if (filters.limit) q = q.limit(filters.limit);
    const { data } = await q;
    return (data || []).map(mapToMeeting);
  }

  static async updateOutcomeCounts(meetingId: string, tenantId: string): Promise<void> {
    const [{ count: aic }, { count: dc }, { count: fc }] = await Promise.all([
      db.from('meeting_action_items').select('*', { count: 'exact', head: true }).eq('meeting_id', meetingId).eq('tenant_id', tenantId),
      db.from('meeting_decisions').select('*', { count: 'exact', head: true }).eq('meeting_id', meetingId).eq('tenant_id', tenantId),
      db.from('meeting_follow_ups').select('*', { count: 'exact', head: true }).eq('meeting_id', meetingId).eq('tenant_id', tenantId),
    ]);
    await db.from('meetings').update({
      action_item_count: aic || 0,
      decision_count: dc || 0,
      follow_up_count: fc || 0,
    }).eq('id', meetingId).eq('tenant_id', tenantId);
  }
}