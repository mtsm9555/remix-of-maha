// src/backend/business/analytics/CohortFunnelAnalysis.ts
import { createClient } from "@supabase/supabase-js";
import { CohortAnalysis, CohortData, FunnelAnalysis, FunnelStep, StepConversion, AggregationPeriod } from "./BusinessAnalyticsTypes";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class CohortFunnelAnalysis {
  
  /**
   * Performs cohort analysis
   */
  static async performCohortAnalysis(
    tenantId: string,
    name: string,
    cohortBy: string,
    cohortPeriod: AggregationPeriod,
    metricToTrack: string,
    startDate: Date,
    endDate: Date
  ): Promise<CohortAnalysis> {
    console.log(`[CohortAnalysis] Performing cohort analysis: ${name}`);
    
    // Get all entities grouped by cohort
    const { data: entities } = await supabase
      .from(cohortBy === 'created_at' ? 'contacts' : 'contacts')
      .select('id, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (!entities || entities.length === 0) {
      throw new Error('No data found for cohort analysis');
    }
    
    // Group entities into cohorts
    const cohorts = this.groupIntoCohorts(entities, cohortPeriod);
    
    // Calculate retention for each cohort
    const cohortData: CohortData[] = [];
    const retentionMatrix: number[][] = [];
    
    for (const cohort of cohorts) {
      const cohortEntities = entities.filter(e => {
        const entityDate = new Date(e.created_at);
        return entityDate >= cohort.startDate && entityDate < cohort.endDate;
      });
      
      const cohortSize = cohortEntities.length;
      const periods: any[] = [];
      const retentionRow: number[] = [];
      
      // Calculate retention for each period
      for (let period = 0; period < 12; period++) {
        const periodStart = new Date(cohort.startDate);
        periodStart.setMonth(periodStart.getMonth() + period);
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        
        // Count entities active in this period
        const activeInPeriod = cohortEntities.filter(e => {
          const entityDate = new Date(e.created_at);
          return entityDate >= periodStart && entityDate < periodEnd;
        }).length;
        
        const retentionRate = cohortSize > 0 ? (activeInPeriod / cohortSize) * 100 : 0;
        
        periods.push({
          period,
          value: activeInPeriod,
          retentionRate
        });
        
        retentionRow.push(retentionRate);
      }
      
      cohortData.push({
        cohortId: cohort.id,
        cohortName: cohort.name,
        cohortDate: cohort.startDate,
        size: cohortSize,
        periods
      });
      
      retentionMatrix.push(retentionRow);
    }
    
    const analysis: CohortAnalysis = {
      id: `cohort_${crypto.randomUUID()}`,
      tenantId,
      name,
      description: `Cohort analysis by ${cohortBy}`,
      cohortBy,
      cohortPeriod,
      metricToTrack,
      startDate,
      endDate,
      cohorts: cohortData,
      retentionMatrix,
      createdAt: new Date()
    };
    
    await supabase.from('cohort_analyses').insert({
      ...analysis,
      cohorts: analysis.cohorts,
      retention_matrix: analysis.retentionMatrix,
      start_date: analysis.startDate.toISOString(),
      end_date: analysis.endDate.toISOString(),
      created_at: analysis.createdAt.toISOString()
    });
    
    return analysis;
  }
  
  /**
   * Performs funnel analysis
   */
  static async performFunnelAnalysis(
    tenantId: string,
    name: string,
    steps: Omit<FunnelStep, 'id' | 'funnelId' | 'count' | 'conversionRate' | 'dropoffRate'>[],
    startDate: Date,
    endDate: Date
  ): Promise<FunnelAnalysis> {
    console.log(`[FunnelAnalysis] Performing funnel analysis: ${name}`);
    
    const funnelSteps: FunnelStep[] = [];
    let previousCount = 0;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Query count for this step
      let query = supabase
        .from(step.eventType === 'contact_created' ? 'contacts' : 
             step.eventType === 'deal_won' ? 'deals' : 'tasks')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      // Apply step filters
      if (step.filters) {
        for (const filter of step.filters) {
          switch (filter.operator) {
            case 'eq':
              query = query.eq(filter.field, filter.value);
              break;
            case 'in':
              query = query.in(filter.field, filter.value);
              break;
          }
        }
      }
      
      const { count } = await query;
      const stepCount = count || 0;
      
      const conversionRate = i === 0 ? 100 : (previousCount > 0 ? (stepCount / previousCount) * 100 : 0);
      const dropoffRate = i === 0 ? 0 : 100 - conversionRate;
      
      funnelSteps.push({
        id: `step_${crypto.randomUUID()}`,
        funnelId: '',
        order: i + 1,
        name: step.name,
        eventType: step.eventType,
        filters: step.filters,
        count: stepCount,
        conversionRate,
        dropoffRate
      });
      
      previousCount = stepCount;
    }
    
    const totalEntrants = funnelSteps[0]?.count || 0;
    const finalCount = funnelSteps[funnelSteps.length - 1]?.count || 0;
    const conversionRate = totalEntrants > 0 ? (finalCount / totalEntrants) * 100 : 0;
    
    // Calculate step conversions
    const stepConversions: StepConversion[] = [];
    for (let i = 0; i < funnelSteps.length - 1; i++) {
      stepConversions.push({
        fromStep: funnelSteps[i].name,
        toStep: funnelSteps[i + 1].name,
        conversionRate: funnelSteps[i + 1].conversionRate,
        count: funnelSteps[i + 1].count
      });
    }
    
    const analysis: FunnelAnalysis = {
      id: `funnel_${crypto.randomUUID()}`,
      tenantId,
      name,
      steps: funnelSteps,
      startDate,
      endDate,
      totalEntrants,
      conversionRate,
      stepConversions,
      createdAt: new Date()
    };
    
    await supabase.from('funnel_analyses').insert({
      ...analysis,
      steps: analysis.steps,
      step_conversions: analysis.stepConversions,
      start_date: analysis.startDate.toISOString(),
      end_date: analysis.endDate.toISOString(),
      created_at: analysis.createdAt.toISOString()
    });
    
    return analysis;
  }
  
  /**
   * Groups entities into cohorts by period
   */
  private static groupIntoCohorts(
    entities: any[],
    period: AggregationPeriod
  ): Array<{ id: string; name: string; startDate: Date; endDate: Date }> {
    const cohorts: Array<{ id: string; name: string; startDate: Date; endDate: Date }> = [];
    
    if (entities.length === 0) return cohorts;
    
    const firstDate = new Date(entities[0].created_at);
    const lastDate = new Date(entities[entities.length - 1].created_at);
    
    let currentDate = new Date(firstDate);
    currentDate.setDate(1); // Start of month
    
    let cohortIndex = 0;
    
    while (currentDate <= lastDate) {
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      switch (period) {
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1);
      }
      
      cohorts.push({
        id: `cohort_${cohortIndex}`,
        name: startDate.toISOString().split('T')[0],
        startDate,
        endDate
      });
      
      currentDate = endDate;
      cohortIndex++;
      
      if (cohortIndex > 12) break; // Limit to 12 cohorts
    }
    
    return cohorts;
  }
}