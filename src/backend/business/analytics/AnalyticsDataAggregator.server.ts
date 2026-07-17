// src/backend/business/analytics/AnalyticsDataAggregator.ts
import { createClient } from "@supabase/supabase-js";
import { AnalyticsMetric, MetricDataPoint, AggregationPeriod, AnalyticsFilter } from "./BusinessAnalyticsTypes";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class AnalyticsDataAggregator {
  
  /**
   * Calculates metric value with filters
   */
  static async calculateMetric(
    tenantId: string,
    metric: AnalyticsMetric,
    timeRange?: { start: Date; end: Date },
    filters?: AnalyticsFilter[]
  ): Promise<number> {
    let query = supabase
      .from(metric.sourceTable)
      .select(metric.sourceField)
      .eq('tenant_id', tenantId);
    
    // Apply time range
    if (timeRange) {
      query = query
        .gte('created_at', timeRange.start.toISOString())
        .lte('created_at', timeRange.end.toISOString());
    }
    
    // Apply metric filters
    if (metric.filters) {
      for (const filter of metric.filters) {
        query = this.applyFilter(query, filter);
      }
    }
    
    // Apply additional filters
    if (filters) {
      for (const filter of filters) {
        query = this.applyFilter(query, filter);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[AnalyticsAggregator] Metric calculation failed:', error);
      return 0;
    }
    
    // Aggregate based on metric type
    return this.aggregate(data, metric.sourceField, metric.aggregation);
  }
  
  /**
   * Gets historical data for a metric
   */
  static async getHistoricalData(
    tenantId: string,
    metric: AnalyticsMetric,
    period: AggregationPeriod,
    periods: number = 12
  ): Promise<MetricDataPoint[]> {
    const dataPoints: MetricDataPoint[] = [];
    const now = new Date();
    
    for (let i = periods - 1; i >= 0; i--) {
      const timeRange = this.getTimeRange(period, i, now);
      const value = await this.calculateMetric(tenantId, metric, timeRange);
      
      dataPoints.push({
        date: timeRange.start,
        value,
        period
      });
    }
    
    return dataPoints;
  }
  
  /**
   * Calculates metric change compared to previous period
   */
  static async calculateMetricChange(
    tenantId: string,
    metric: AnalyticsMetric,
    period: AggregationPeriod
  ): Promise<{
    currentValue: number;
    previousValue: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const now = new Date();
    const currentTimeRange = this.getTimeRange(period, 0, now);
    const previousTimeRange = this.getTimeRange(period, 1, now);
    
    const currentValue = await this.calculateMetric(tenantId, metric, currentTimeRange);
    const previousValue = await this.calculateMetric(tenantId, metric, previousTimeRange);
    
    const changePercent = previousValue > 0 
      ? ((currentValue - previousValue) / previousValue) * 100 
      : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 5) trend = 'up';
    else if (changePercent < -5) trend = 'down';
    
    return {
      currentValue,
      previousValue,
      changePercent,
      trend
    };
  }
  
  /**
   * Applies filter to query
   */
  private static applyFilter(query: any, filter: AnalyticsFilter): any {
    switch (filter.operator) {
      case 'eq':
        return query.eq(filter.field, filter.value);
      case 'neq':
        return query.neq(filter.field, filter.value);
      case 'gt':
        return query.gt(filter.field, filter.value);
      case 'lt':
        return query.lt(filter.field, filter.value);
      case 'gte':
        return query.gte(filter.field, filter.value);
      case 'lte':
        return query.lte(filter.field, filter.value);
      case 'in':
        return query.in(filter.field, filter.value);
      case 'contains':
        return query.contains(filter.field, filter.value);
      case 'between':
        return query
          .gte(filter.field, filter.value[0])
          .lte(filter.field, filter.value[1]);
      default:
        return query;
    }
  }
  
  /**
   * Aggregates data based on aggregation function
   */
  private static aggregate(data: any[], field: string, aggregation: string): number {
    if (!data || data.length === 0) return 0;
    
    const values = data.map(d => d[field]).filter(v => v !== null && v !== undefined);
    
    switch (aggregation) {
      case 'count':
        return values.length;
      case 'sum':
        return values.reduce((sum, v) => sum + Number(v), 0);
      case 'average':
        return values.length > 0 ? values.reduce((sum, v) => sum + Number(v), 0) / values.length : 0;
      case 'min':
        return Math.min(...values.map(v => Number(v)));
      case 'max':
        return Math.max(...values.map(v => Number(v)));
      default:
        return values.length;
    }
  }
  
  /**
   * Gets time range for a period
   */
  private static getTimeRange(period: AggregationPeriod, offset: number, referenceDate: Date): { start: Date; end: Date } {
    const end = new Date(referenceDate);
    const start = new Date(referenceDate);
    
    switch (period) {
      case 'hourly':
        start.setHours(start.getHours() - offset - 1);
        end.setHours(end.getHours() - offset);
        break;
      case 'daily':
        start.setDate(start.getDate() - offset - 1);
        end.setDate(end.getDate() - offset);
        break;
      case 'weekly':
        start.setDate(start.getDate() - (offset + 1) * 7);
        end.setDate(end.getDate() - offset * 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - offset - 1);
        end.setMonth(end.getMonth() - offset);
        break;
      case 'quarterly':
        start.setMonth(start.getMonth() - (offset + 1) * 3);
        end.setMonth(end.getMonth() - offset * 3);
        break;
      case 'yearly':
        start.setFullYear(start.getFullYear() - offset - 1);
        end.setFullYear(end.getFullYear() - offset);
        break;
    }
    
    return { start, end };
  }
  
  /**
   * Creates standard business metrics
   */
  static async createStandardMetrics(tenantId: string): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [
      {
        id: `metric_${crypto.randomUUID()}`,
        tenantId,
        name: 'Total Contacts',
        description: 'Total number of contacts in CRM',
        module: 'crm',
        metricType: 'count',
        sourceTable: 'contacts',
        sourceField: 'id',
        aggregation: 'count',
        currentValue: 0,
        trend: 'stable',
        format: 'number',
        historicalData: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `metric_${crypto.randomUUID()}`,
        tenantId,
        name: 'Won Deals Value',
        description: 'Total value of won deals',
        module: 'sales',
        metricType: 'sum',
        sourceTable: 'deals',
        sourceField: 'value',
        aggregation: 'sum',
        filters: [{ field: 'stage', operator: 'eq', value: 'closed_won' }],
        currentValue: 0,
        trend: 'stable',
        format: 'currency',
        unit: 'USD',
        historicalData: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `metric_${crypto.randomUUID()}`,
        tenantId,
        name: 'Active Projects',
        description: 'Number of active projects',
        module: 'projects',
        metricType: 'count',
        sourceTable: 'projects',
        sourceField: 'id',
        aggregation: 'count',
        filters: [{ field: 'status', operator: 'eq', value: 'active' }],
        currentValue: 0,
        trend: 'stable',
        format: 'number',
        historicalData: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `metric_${crypto.randomUUID()}`,
        tenantId,
        name: 'Completed Tasks',
        description: 'Number of completed tasks',
        module: 'projects',
        metricType: 'count',
        sourceTable: 'tasks',
        sourceField: 'id',
        aggregation: 'count',
        filters: [{ field: 'status', operator: 'eq', value: 'completed' }],
        currentValue: 0,
        trend: 'stable',
        format: 'number',
        historicalData: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `metric_${crypto.randomUUID()}`,
        tenantId,
        name: 'Meetings Held',
        description: 'Number of completed meetings',
        module: 'meetings',
        metricType: 'count',
        sourceTable: 'meetings',
        sourceField: 'id',
        aggregation: 'count',
        filters: [{ field: 'status', operator: 'eq', value: 'completed' }],
        currentValue: 0,
        trend: 'stable',
        format: 'number',
        historicalData: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `metric_${crypto.randomUUID()}`,
        tenantId,
        name: 'Documents Uploaded',
        description: 'Number of documents uploaded',
        module: 'documents',
        metricType: 'count',
        sourceTable: 'documents',
        sourceField: 'id',
        aggregation: 'count',
        filters: [{ field: 'status', operator: 'eq', value: 'active' }],
        currentValue: 0,
        trend: 'stable',
        format: 'number',
        historicalData: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `metric_${crypto.randomUUID()}`,
        tenantId,
        name: 'Knowledge Articles',
        description: 'Number of published knowledge articles',
        module: 'knowledge',
        metricType: 'count',
        sourceTable: 'articles',
        sourceField: 'id',
        aggregation: 'count',
        filters: [{ field: 'status', operator: 'eq', value: 'published' }],
        currentValue: 0,
        trend: 'stable',
        format: 'number',
        historicalData: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await supabase.from('analytics_metrics').insert(metrics);
    
    return metrics;
  }
}