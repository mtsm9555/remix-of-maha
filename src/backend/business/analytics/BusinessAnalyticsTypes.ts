// src/backend/business/analytics/BusinessAnalyticsTypes.ts

export type AnalyticsModule = 'crm' | 'projects' | 'meetings' | 'documents' | 'knowledge' | 'financial' | 'sales' | 'marketing';
export type MetricType = 'count' | 'sum' | 'average' | 'min' | 'max' | 'rate' | 'ratio';
export type AggregationPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'funnel' | 'cohort';
export type ReportStatus = 'draft' | 'scheduled' | 'completed' | 'failed';
export type InsightCategory = 'growth' | 'efficiency' | 'risk' | 'opportunity' | 'anomaly';

export interface AnalyticsMetric {
  id: string;
  tenantId: string;
  
  // Definition
  name: string;
  description: string;
  module: AnalyticsModule;
  metricType: MetricType;
  
  // Calculation
  sourceTable: string;
  sourceField: string;
  aggregation: string; // SQL aggregation function
  filters?: AnalyticsFilter[];
  
  // Current Value
  currentValue: number;
  previousValue?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  
  // Visualization
  unit?: string;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  
  // Historical Data
  historicalData: MetricDataPoint[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricDataPoint {
  date: Date;
  value: number;
  period: AggregationPeriod;
}

export interface AnalyticsFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'between';
  value: any;
}

export interface AnalyticsReport {
  id: string;
  tenantId: string;
  
  // Basic Info
  name: string;
  description?: string;
  category: string;
  
  // Configuration
  metrics: string[]; // Metric IDs
  dimensions: string[]; // Grouping fields
  filters: AnalyticsFilter[];
  timeRange: {
    start: Date;
    end: Date;
  };
  
  // Visualization
  charts: ReportChart[];
  layout: ReportLayout;
  
  // Scheduling
  isScheduled: boolean;
  scheduleCron?: string;
  recipients?: string[];
  
  // Status
  status: ReportStatus;
  lastGeneratedAt?: Date;
  nextScheduledAt?: Date;
  
  // Results
  data?: any;
  insights?: AnalyticsInsight[];
  
  // Access
  ownerId: string;
  sharedWith: string[];
  isPublic: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportChart {
  id: string;
  reportId: string;
  
  type: ChartType;
  title: string;
  metrics: string[];
  dimensions?: string[];
  
  // Configuration
  config: {
    showLegend?: boolean;
    showGrid?: boolean;
    stackBars?: boolean;
    colorScheme?: string;
  };
  
  // Position
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface ReportLayout {
  columns: number;
  rowHeight: number;
  pageSize: 'A4' | 'Letter' | 'Custom';
  orientation: 'portrait' | 'landscape';
}

export interface AnalyticsInsight {
  id: string;
  reportId?: string;
  tenantId: string;
  
  // Insight Details
  category: InsightCategory;
  title: string;
  description: string;
  
  // Impact
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  
  // Data
  relatedMetrics: string[];
  supportingData: Record<string, any>;
  
  // Action
  recommendedAction?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Status
  status: 'new' | 'reviewed' | 'actioned' | 'dismissed';
  
  createdAt: Date;
}

export interface CohortAnalysis {
  id: string;
  tenantId: string;
  
  // Definition
  name: string;
  description?: string;
  
  // Cohort Configuration
  cohortBy: string; // Field to group by (e.g., 'created_at', 'first_purchase_date')
  cohortPeriod: AggregationPeriod;
  metricToTrack: string; // Metric to measure over time
  
  // Time Range
  startDate: Date;
  endDate: Date;
  
  // Results
  cohorts: CohortData[];
  retentionMatrix: number[][];
  
  createdAt: Date;
}

export interface CohortData {
  cohortId: string;
  cohortName: string;
  cohortDate: Date;
  size: number;
  
  // Period data
  periods: {
    period: number;
    value: number;
    retentionRate: number;
  }[];
}

export interface FunnelAnalysis {
  id: string;
  tenantId: string;
  
  // Definition
  name: string;
  description?: string;
  
  // Funnel Steps
  steps: FunnelStep[];
  
  // Time Range
  startDate: Date;
  endDate: Date;
  
  // Results
  totalEntrants: number;
  conversionRate: number;
  stepConversions: StepConversion[];
  
  createdAt: Date;
}

export interface FunnelStep {
  id: string;
  funnelId: string;
  order: number;
  
  name: string;
  eventType: string;
  filters?: AnalyticsFilter[];
  
  // Results
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface StepConversion {
  fromStep: string;
  toStep: string;
  conversionRate: number;
  count: number;
}

export interface PredictiveForecast {
  id: string;
  tenantId: string;
  
  // Forecast Definition
  metricId: string;
  forecastPeriod: AggregationPeriod;
  forecastHorizon: number; // Number of periods to forecast
  
  // Model
  modelType: 'linear' | 'exponential' | 'arima' | 'prophet';
  modelConfidence: number;
  
  // Results
  historicalData: MetricDataPoint[];
  forecastData: ForecastDataPoint[];
  
  // Accuracy
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  
  createdAt: Date;
}

export interface ForecastDataPoint {
  date: Date;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface BenchmarkComparison {
  id: string;
  tenantId: string;
  
  // Benchmark Definition
  metricId: string;
  benchmarkType: 'industry' | 'competitor' | 'historical' | 'target';
  
  // Comparison
  currentValue: number;
  benchmarkValue: number;
  difference: number;
  differencePercent: number;
  
  // Context
  benchmarkSource: string;
  benchmarkPeriod: string;
  
  createdAt: Date;
}

export interface AnalyticsDashboard {
  id: string;
  tenantId: string;
  
  name: string;
  description?: string;
  
  // Widgets
  widgets: AnalyticsWidget[];
  
  // Filters
  globalFilters: AnalyticsFilter[];
  timeRange: { start: Date; end: Date };
  
  // Access
  ownerId: string;
  sharedWith: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsWidget {
  id: string;
  dashboardId: string;
  
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'cohort';
  title: string;
  
  // Configuration
  metricId?: string;
  chartType?: ChartType;
  dimensions?: string[];
  filters?: AnalyticsFilter[];
  
  // Position
  position: { x: number; y: number };
  size: { width: number; height: number };
  
  // Data
  data?: any;
  
  createdAt: Date;
  updatedAt: Date;
}