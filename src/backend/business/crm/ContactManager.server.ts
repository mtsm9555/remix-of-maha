import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Contact, ContactStatus } from "./CRMTypes";

const TABLE = "crm_contacts";

function mapContact(row: any): Contact {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone ?? undefined,
    title: row.title ?? undefined,
    companyId: row.company_id ?? undefined,
    status: row.status,
    leadScore: row.lead_score ?? 0,
    lifecycleStage: row.lifecycle_stage ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? undefined,
    timezone: row.timezone ?? undefined,
    language: row.language ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    twitterHandle: row.twitter_handle ?? undefined,
    website: row.website ?? undefined,
    address: row.address ?? undefined,
    tags: row.tags ?? [],
    segments: row.segments ?? [],
    consentGiven: !!row.consent_given,
    consentDate: row.consent_date ? new Date(row.consent_date) : undefined,
    doNotContact: !!row.do_not_contact,
    source: row.source ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at) : undefined,
    nextActivityAt: row.next_activity_at ? new Date(row.next_activity_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ContactManager {
  static async createContact(
    tenantId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      title?: string;
      companyId?: string;
      status?: ContactStatus;
      tags?: string[];
      source?: string;
      assignedTo?: string;
    },
  ): Promise<Contact> {
    const { data: existing } = await supabaseAdmin
      .from(TABLE)
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", data.email)
      .maybeSingle();
    if (existing) throw new Error("Contact with this email already exists");

    const id = `contact_${crypto.randomUUID()}`;
    const { data: inserted, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        id,
        tenant_id: tenantId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        company_id: data.companyId,
        status: data.status ?? "lead",
        tags: data.tags ?? [],
        segments: [],
        source: data.source,
        assigned_to: data.assignedTo,
        consent_given: false,
        do_not_contact: false,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapContact(inserted);
  }

  static async updateContact(
    contactId: string,
    tenantId: string,
    updates: Partial<Contact>,
  ): Promise<Contact> {
    const patch: Record<string, any> = {};
    if (updates.firstName !== undefined) patch.first_name = updates.firstName;
    if (updates.lastName !== undefined) patch.last_name = updates.lastName;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.companyId !== undefined) patch.company_id = updates.companyId;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.leadScore !== undefined) patch.lead_score = updates.leadScore;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.segments !== undefined) patch.segments = updates.segments;
    if (updates.assignedTo !== undefined) patch.assigned_to = updates.assignedTo;
    if (updates.consentGiven !== undefined) patch.consent_given = updates.consentGiven;
    if (updates.doNotContact !== undefined) patch.do_not_contact = updates.doNotContact;
    if (updates.address !== undefined) patch.address = updates.address;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(patch)
      .eq("id", contactId)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw error;
    if (!data) throw new Error("Contact not found");
    return mapContact(data);
  }

  static async calculateLeadScore(contactId: string, tenantId: string): Promise<number> {
    const { data: contact } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("id", contactId)
      .eq("tenant_id", tenantId)
      .single();
    if (!contact) throw new Error("Contact not found");

    let score = 0;
    if (contact.phone) score += 10;
    if (contact.title) score += 10;
    if (contact.company_id) score += 15;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("crm_activities")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .contains("contact_ids", [contactId])
      .gte("created_at", since);
    score += Math.min(30, (count ?? 0) * 3);
    if (contact.email) score += 10;

    if (contact.company_id) {
      const { data: company } = await supabaseAdmin
        .from("crm_companies")
        .select("size")
        .eq("id", contact.company_id)
        .maybeSingle();
      if (company) {
        if (company.size === "enterprise") score += 25;
        else if (company.size === "medium") score += 15;
        else if (company.size === "small") score += 10;
      }
    }

    const finalScore = Math.min(100, score);
    await supabaseAdmin.from(TABLE).update({ lead_score: finalScore }).eq("id", contactId);
    return finalScore;
  }

  static async getContacts(
    tenantId: string,
    filters: {
      status?: ContactStatus;
      companyId?: string;
      assignedTo?: string;
      tags?: string[];
      search?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<Contact[]> {
    let query = supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false });
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.companyId) query = query.eq("company_id", filters.companyId);
    if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
    if (filters.tags?.length) query = query.overlaps("tags", filters.tags);
    if (filters.search) {
      const s = filters.search;
      query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset != null)
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
    const { data } = await query;
    return (data ?? []).map(mapContact);
  }

  static async getContact(contactId: string, tenantId: string): Promise<Contact | null> {
    const { data } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("id", contactId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    return data ? mapContact(data) : null;
  }
}