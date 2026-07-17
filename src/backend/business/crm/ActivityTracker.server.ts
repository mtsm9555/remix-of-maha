import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Activity, ActivityStatus, ActivityType } from "./CRMTypes";

const TABLE = "crm_activities";

function mapActivity(row: any): Activity {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    type: row.type,
    subject: row.subject,
    description: row.description ?? undefined,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    durationMinutes: row.duration_minutes ?? undefined,
    status: row.status,
    contactIds: row.contact_ids ?? [],
    companyId: row.company_id ?? undefined,
    dealId: row.deal_id ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    createdBy: row.created_by,
    outcome: row.outcome ?? undefined,
    nextSteps: row.next_steps ?? undefined,
    tags: row.tags ?? [],
    attachments: row.attachments ?? [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ActivityTracker {
  static async logActivity(
    tenantId: string,
    data: {
      type: ActivityType;
      subject: string;
      description?: string;
      contactIds?: string[];
      companyId?: string;
      dealId?: string;
      assignedTo?: string;
      scheduledAt?: Date;
      durationMinutes?: number;
      tags?: string[];
    },
    createdBy: string,
  ): Promise<Activity> {
    const id = `activity_${crypto.randomUUID()}`;
    const status: ActivityStatus =
      data.scheduledAt && data.scheduledAt > new Date() ? "scheduled" : "completed";
    const contactIds = data.contactIds ?? [];
    const { data: inserted, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        id,
        tenant_id: tenantId,
        type: data.type,
        subject: data.subject,
        description: data.description,
        scheduled_at: data.scheduledAt?.toISOString(),
        duration_minutes: data.durationMinutes,
        status,
        contact_ids: contactIds,
        company_id: data.companyId,
        deal_id: data.dealId,
        assigned_to: data.assignedTo ?? createdBy,
        created_by: createdBy,
        tags: data.tags ?? [],
      })
      .select("*")
      .single();
    if (error) throw error;

    if (contactIds.length) {
      const now = new Date().toISOString();
      await Promise.all(
        contactIds.map((cid) =>
          supabaseAdmin.from("crm_contacts").update({ last_activity_at: now }).eq("id", cid),
        ),
      );
    }
    return mapActivity(inserted);
  }

  static async completeActivity(
    activityId: string,
    tenantId: string,
    outcome?: string,
    nextSteps?: string,
  ): Promise<void> {
    await supabaseAdmin
      .from(TABLE)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        outcome,
        next_steps: nextSteps,
      })
      .eq("id", activityId)
      .eq("tenant_id", tenantId);
  }

  static async getActivities(
    tenantId: string,
    filters: {
      type?: ActivityType;
      status?: ActivityStatus;
      contactId?: string;
      companyId?: string;
      dealId?: string;
      assignedTo?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    } = {},
  ): Promise<Activity[]> {
    let query = supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (filters.type) query = query.eq("type", filters.type);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.contactId) query = query.contains("contact_ids", [filters.contactId]);
    if (filters.companyId) query = query.eq("company_id", filters.companyId);
    if (filters.dealId) query = query.eq("deal_id", filters.dealId);
    if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
    if (filters.fromDate) query = query.gte("created_at", filters.fromDate.toISOString());
    if (filters.toDate) query = query.lte("created_at", filters.toDate.toISOString());
    if (filters.limit) query = query.limit(filters.limit);
    const { data } = await query;
    return (data ?? []).map(mapActivity);
  }

  static async getOverdueActivities(tenantId: string): Promise<Activity[]> {
    const { data } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "scheduled")
      .lt("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });
    return (data ?? []).map(mapActivity);
  }
}