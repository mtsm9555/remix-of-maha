// src/backend/business/analytics/AnalyticsManager.ts
import { createClient } from "@supabase/supabase-js";
import { AnalyticsReport, AnalyticsInsight, InsightCategory } from "./BusinessAnalyticsTypes";
import { AnalyticsDataAggregator } from "./AnalyticsDataAggregator";
import { ModelServer } from "../../model/ModelServer";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class AnalyticsManager {
  
  /**
   * Creates a new analytics report
   */
  static async createReport(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      category: string;
      metrics: string[];
      dimensions?: string[];
      filters?: any[];
      timeRange: { start: Date; end: Date };
      charts?: any[];
      isScheduled?: boolean;
      scheduleCron?: string;
      recipients?: string[];
    },
    ownerId: string
  ): Promise<AnalyticsReport> {
    const report: AnalyticsReport = {
      id: `report_${crypto.randomUUID()}`,
      tenantId,
      name: data.name,
      description: data.description,
      category: data.category,
      metrics: data.metrics,
      dimensions: data.dimensions || [],
      filters: data.filters || [],
      timeRange: data.timeRange,
      charts: data.charts || [],
      layout: {
        columns: 12,
        rowHeight: 80,
        pageSize: 'A4',
        orientation: 'portrait'
      },
      isScheduled: data.isScheduled || false,
      scheduleCron: data.scheduleCron,
      recipients: data.recipients,
      status: 'draft',
      ownerId,
      sharedWith: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await supabase.from('analytics_reports').insert({
      ...report,
      time_range: report.timeRange,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString()
    });
    
    console.log(`[AnalyticsManager] Created report: ${report.name}`);
    return report;
  }
  
  /**
   * Generates report data
   */
  static async generateReportData(
    reportId: string,
    tenantId: string
  ): Promise<AnalyticsReport> {
    const { data: report } = await supabase
      .from('analytics_reports')
      .select('*')
      .eq('id', reportId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (!report) throw new Error('Report not found');
    
    // Get metrics
    const { data: metrics } = await supabase
      .from('analytics_metrics')
      .select('*')
      .in('id', report.metrics)
      .eq('tenant_id', tenantId);
    
    // Calculate metric values
    const reportData: any = {};
    
    for (const metric of metrics || []) {
      const value = await AnalyticsDataAggregator.calculateMetric(
        tenantId,
        metric,
        report.time_range
      );
      
      reportData[metric.id] = {
        name: metric.name,
        value,
        format: metric.format,
        unit: metric.unit
      };
    }
    
    // Generate insights
    const insights = await this.generateInsights(tenantId, reportData);
    
    // Update report
    await supabase
      .from('analytics_reports')
      .update({
        status: 'completed',
        data: reportData,
        insights,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);
    
    console.log(`[AnalyticsManager] Generated report data: ${reportId}`);
    
    return {
      ...report,
      data: reportData,
      insights,
      status: 'completed',
      lastGeneratedAt: new Date()
    };
  }
  
  /**
   * Generates AI-powered insights from report data
   */
  private static async generateInsights(
    tenantId: string,
    reportData: any
  ): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];
    
    // Analyze metrics for patterns
    const metrics = Object.values(reportData) as any[];
    
    // Growth insight
    const revenueMetric = metrics.find(m => m.name?.includes('Revenue') || m.name?.includes('Deals'));
    if (revenueMetric && revenueMetric.value > 100000) {
      insights.push({
        id: `insight_${crypto.randomUUID()}`,
        tenantId,
        category: 'growth',
        title: 'Strong Revenue Performance',
        description: `Revenue of $${revenueMetric.value.toLocaleString()} indicates strong market traction`,
        impactLevel: 'high',
        confidence: 85,
        relatedMetrics: [revenueMetric.name],
        supportingData: { value: revenueMetric.value },
        recommendedAction: 'Consider scaling marketing efforts to accelerate growth',
        priority: 'medium',
        status: 'new',
        createdAt: new Date()
      });
    }
    
    // Efficiency insight
    const taskMetric = metrics.find(m => m.name?.includes('Tasks'));
    const projectMetric = metrics.find(m => m.name?.includes('Projects'));
    
    if (taskMetric && projectMetric && projectMetric.value > 0) {
      const tasksPerProject = taskMetric.value / projectMetric.value;
      
      if (tasksPerProject > 20) {
        insights.push({
          id: `insight_${crypto.randomUUID()}`,
          tenantId,
          category: 'efficiency',
          title: 'High Task-to-Project Ratio',
          description: `Average of ${tasksPerProject.toFixed(1)} tasks per project suggests complex projects or potential scope creep`,
          impactLevel: 'medium',
          confidence: 75,
          relatedMetrics: ['Tasks', 'Projects'],
          supportingData: { ratio: tasksPerProject },
          recommendedAction: 'Review project scoping process and consider breaking down large projects',
          priority: 'medium',
          status: 'new',
          createdAt: new Date()
        });
      }
    }
    
    // Save insights
    if (insights.length > 0) {
      await supabase.from('analytics_insights').insert(insights);
    }
    
    return insights;
  }
  
  /**
   * Gets reports for a tenant
   */
  static async getReports(
    tenantId: string,
    filters: {
      category?: string;
      status?: string;
      ownerId?: string;
      limit?: number;
    } = {}
  ): Promise<AnalyticsReport[]> {
    let query = supabase
      .from('analytics_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.ownerId) query = query.eq('owner_id', filters.ownerId);
    if (filters.limit) query = query.limit(filters.limit);
    
    const { data } = await query;
    
    return (data || []).map((r: any) => ({
      ...r,
      timeRange: r.time_range,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
      lastGeneratedAt: r.last_generated_at ? new Date(r.last_generated_at) : undefined
    }));
  }
  
  /**
   * Seeds default reports
   */
  static async seedDefaultReports(tenantId: string, userId: string): Promise<void> {
    const defaultReports = [
      {
        name: 'Monthly Business Review',
        description: 'Comprehensive monthly business performance report',
        category: 'executive',
        metrics: [],
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        isScheduled: true,
        scheduleCron: '0 9 1 * *', // First day of month at 9 AM
        recipients: [userId]
      },
      {
        name: 'Sales Performance Report',
        description: 'Sales pipeline and conversion metrics',
        category: 'sales',
        metrics: [],
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      },
      {
        name: 'Project Status Report',
        description: 'Active projects and task completion metrics',
        category: 'operations',
        metrics: [],
        timeRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }
    ];
    
    for (const report of defaultReports) {
      await this.createReport(tenantId, report, userId);
    }
    
    console.log(`[AnalyticsManager] Seeded default reports for tenant ${tenantId}`);
  }
}