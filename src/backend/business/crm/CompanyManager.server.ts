import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Company } from "./CRMTypes";

const TABLE = "crm_companies";

function mapCompany(row: any): Company {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    domain: row.domain ?? undefined,
    industry: row.industry ?? undefined,
    size: row.size ?? undefined,
    annualRevenue: row.annual_revenue ?? undefined,
    fundingStage: row.funding_stage ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    address: row.address ?? undefined,
    status: row.status,
    accountTier: row.account_tier ?? undefined,
    totalContacts: row.total_contacts ?? 0,
    totalDeals: row.total_deals ?? 0,
    totalRevenue: row.total_revenue ?? 0,
    lifetimeValue: row.lifetime_value ?? undefined,
    tags: row.tags ?? [],
    segments: row.segments ?? [],
    assignedTo: row.assigned_to ?? undefined,
    description: row.description ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class CompanyManager {
  static async createCompany(
    tenantId: string,
    data: {
      name: string;
      domain?: string;
      industry?: string;
      size?: "startup" | "small" | "medium" | "enterprise";
      phone?: string;
      email?: string;
      website?: string;
      address?: any;
      tags?: string[];
      assignedTo?: string;
    },
  ): Promise<Company> {
    if (data.domain) {
      const { data: existing } = await supabaseAdmin
        .from(TABLE)
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("domain", data.domain)
        .maybeSingle();
      if (existing) throw new Error("Company with this domain already exists");
    }
    const id = `company_${crypto.randomUUID()}`;
    const { data: inserted, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        id,
        tenant_id: tenantId,
        name: data.name,
        domain: data.domain,
        industry: data.industry,
        size: data.size,
        phone: data.phone,
        email: data.email,
        website: data.website,
        address: data.address ?? {},
        status: "prospect",
        tags: data.tags ?? [],
        segments: [],
        total_contacts: 0,
        total_deals: 0,
        total_revenue: 0,
        assigned_to: data.assignedTo,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapCompany(inserted);
  }

  static async updateMetrics(companyId: string, tenantId: string): Promise<void> {
    const [{ count: contactCount }, { count: dealCount }, { data: wonDeals }] = await Promise.all([
      supabaseAdmin
        .from("crm_contacts")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("company_id", companyId),
      supabaseAdmin
        .from("crm_deals")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("company_id", companyId),
      supabaseAdmin
        .from("crm_deals")
        .select("value")
        .eq("tenant_id", tenantId)
        .eq("company_id", companyId)
        .eq("stage", "closed_won"),
    ]);
    const totalRevenue = (wonDeals ?? []).reduce((s: number, d: any) => s + (d.value ?? 0), 0);
    await supabaseAdmin
      .from(TABLE)
      .update({
        total_contacts: contactCount ?? 0,
        total_deals: dealCount ?? 0,
        total_revenue: totalRevenue,
      })
      .eq("id", companyId);
  }

  static async getCompanies(
    tenantId: string,
    filters: {
      status?: string;
      industry?: string;
      size?: string;
      assignedTo?: string;
      tags?: string[];
      search?: string;
      limit?: number;
    } = {},
  ): Promise<Company[]> {
    let query = supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false });
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.industry) query = query.eq("industry", filters.industry);
    if (filters.size) query = query.eq("size", filters.size);
    if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
    if (filters.tags?.length) query = query.overlaps("tags", filters.tags);
    if (filters.search) {
      const s = filters.search;
      query = query.or(`name.ilike.%${s}%,domain.ilike.%${s}%`);
    }
    if (filters.limit) query = query.limit(filters.limit);
    const { data } = await query;
    return (data ?? []).map(mapCompany);
  }
}