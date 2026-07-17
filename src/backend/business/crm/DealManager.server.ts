import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CompanyManager } from "./CompanyManager.server";
import type { Deal, DealStage, DealPriority } from "./CRMTypes";

const TABLE = "crm_deals";

function mapDeal(row: any): Deal {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description ?? undefined,
    value: row.value,
    currency: row.currency,
    expectedCloseDate: row.expected_close_date ? new Date(row.expected_close_date) : undefined,
    stage: row.stage,
    probability: row.probability,
    priority: row.priority,
    companyId: row.company_id ?? undefined,
    contactIds: row.contact_ids ?? [],
    assignedTo: row.assigned_to ?? undefined,
    teamIds: row.team_ids ?? [],
    closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
    lostReason: row.lost_reason ?? undefined,
    pipelineId: row.pipeline_id,
    stageEnteredAt: new Date(row.stage_entered_at),
    tags: row.tags ?? [],
    source: row.source ?? undefined,
    campaignId: row.campaign_id ?? undefined,
    forecastCategory: row.forecast_category ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class DealManager {
  static async createDeal(
    tenantId: string,
    data: {
      name: string;
      value: number;
      currency?: string;
      companyId?: string;
      contactIds?: string[];
      pipelineId: string;
      stage?: DealStage;
      priority?: DealPriority;
      expectedCloseDate?: Date;
      assignedTo?: string;
      tags?: string[];
    },
  ): Promise<Deal> {
    const id = `deal_${crypto.randomUUID()}`;
    const stage = data.stage ?? "qualification";
    const { data: inserted, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        id,
        tenant_id: tenantId,
        name: data.name,
        value: data.value,
        currency: data.currency ?? "USD",
        company_id: data.companyId,
        contact_ids: data.contactIds ?? [],
        pipeline_id: data.pipelineId,
        stage,
        probability: DealManager.getStageProbability(stage),
        priority: data.priority ?? "medium",
        expected_close_date: data.expectedCloseDate?.toISOString(),
        assigned_to: data.assignedTo,
        tags: data.tags ?? [],
        stage_entered_at: new Date().toISOString(),
        forecast_category: "pipeline",
        metadata: {},
      })
      .select("*")
      .single();
    if (error) throw error;
    if (data.companyId) await CompanyManager.updateMetrics(data.companyId, tenantId);
    return mapDeal(inserted);
  }

  static async advanceStage(
    dealId: string,
    tenantId: string,
    newStage: DealStage,
    _updatedBy: string,
    notes?: string,
  ): Promise<Deal> {
    const { data: deal } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("id", dealId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!deal) throw new Error("Deal not found");

    const updates: Record<string, any> = {
      stage: newStage,
      probability: DealManager.getStageProbability(newStage),
      stage_entered_at: new Date().toISOString(),
    };
    if (newStage === "closed_won" || newStage === "closed_lost") {
      updates.closed_at = new Date().toISOString();
      updates.forecast_category = "closed";
      if (newStage === "closed_lost") updates.lost_reason = notes;
    }
    const { data: updated, error } = await supabaseAdmin
      .from(TABLE)
      .update(updates)
      .eq("id", dealId)
      .select("*")
      .single();
    if (error) throw error;
    if (deal.company_id) await CompanyManager.updateMetrics(deal.company_id, tenantId);
    return mapDeal(updated);
  }

  private static getStageProbability(stage: DealStage): number {
    const p: Record<DealStage, number> = {
      qualification: 10,
      proposal: 40,
      negotiation: 70,
      closed_won: 100,
      closed_lost: 0,
    };
    return p[stage] ?? 0;
  }

  static async getDeals(
    tenantId: string,
    filters: {
      stage?: DealStage;
      companyId?: string;
      assignedTo?: string;
      pipelineId?: string;
      minValue?: number;
      maxValue?: number;
      tags?: string[];
      limit?: number;
    } = {},
  ): Promise<Deal[]> {
    let query = supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false });
    if (filters.stage) query = query.eq("stage", filters.stage);
    if (filters.companyId) query = query.eq("company_id", filters.companyId);
    if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
    if (filters.pipelineId) query = query.eq("pipeline_id", filters.pipelineId);
    if (filters.minValue != null) query = query.gte("value", filters.minValue);
    if (filters.maxValue != null) query = query.lte("value", filters.maxValue);
    if (filters.tags?.length) query = query.overlaps("tags", filters.tags);
    if (filters.limit) query = query.limit(filters.limit);
    const { data } = await query;
    return (data ?? []).map(mapDeal);
  }

  static async calculatePipelineMetrics(
    tenantId: string,
    pipelineId: string,
  ): Promise<{
    totalDeals: number;
    totalValue: number;
    weightedValue: number;
    averageDealSize: number;
    winRate: number;
  }> {
    const { data: deals } = await supabaseAdmin
      .from(TABLE)
      .select("value, probability, stage")
      .eq("tenant_id", tenantId)
      .eq("pipeline_id", pipelineId);
    const list = deals ?? [];
    const totalDeals = list.length;
    const totalValue = list.reduce((s: number, d: any) => s + (d.value ?? 0), 0);
    const weightedValue = list.reduce(
      (s: number, d: any) => s + ((d.value ?? 0) * (d.probability ?? 0)) / 100,
      0,
    );
    const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
    const won = list.filter((d: any) => d.stage === "closed_won").length;
    const lost = list.filter((d: any) => d.stage === "closed_lost").length;
    const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;
    return { totalDeals, totalValue, weightedValue, averageDealSize, winRate };
  }
}