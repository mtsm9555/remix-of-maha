// src/backend/business/executive/ExecutiveDashboardTypes.ts

export type ExecutiveRole = 'CEO' | 'CFO' | 'COO' | 'CTO' | 'CMO' | 'CRO';
export type KPIStatus = 'exceeding' | 'on_track' | 'at_risk' | 'critical';
export type TrendDirection = 'strong_up' | 'up' | 'stable' | 'down' | 'strong_down';
export type InsightType = 'opportunity' | 'risk' | 'anomaly' | 'recommendation';
export type BriefingFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ExecutiveDashboard {
  id: string;
  tenantId: string;
  
  // Configuration
  name: string;
  role: ExecutiveRole;
  isDefault: boolean;
  
  // KPIs
  kpis: ExecutiveKPI[];
  
  // Strategic Metrics
  financialHealth: FinancialHealthMetrics;
  growthMetrics: GrowthMetrics;
  operationalMetrics: OperationalMetrics;
  marketMetrics: MarketMetrics;
  
  // Insights
  insights: ExecutiveInsight[];
  risks: ExecutiveRisk[];
  opportunities: ExecutiveOpportunity[];
  
  // OKRs
  okrs: OKR[];
  
  // Briefings
  briefingFrequency: BriefingFrequency;
  lastBriefingAt?: Date;
  nextBriefingAt?: Date;
  
  // Access
  ownerId: string;
  sharedWith: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutiveKPI {
  id: string;
  dashboardId: string;
  
  // Definition
  name: string;
  category: 'financial' | 'growth' | 'operational' | 'customer' | 'market';
  description: string;
  
  // Metrics
  currentValue: number;
  targetValue: number;
  previousValue?: number;
  
  // Status
  status: KPIStatus;
  trend: TrendDirection;
  changePercent: number;
  
  // Visualization
  unit: string;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  
  // Timeline
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  historicalData: KPIHistoricalPoint[];
  
  // Alerts
  alertThresholds?: {
    warning: number;
    critical: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIHistoricalPoint {
  date: Date;
  value: number;
}

export interface FinancialHealthMetrics {
  // Revenue
  totalRevenue: number;
  revenueGrowth: number;
  recurringRevenue: number;
  averageDealSize: number;
  
  // Profitability
  grossMargin: number;
  netMargin: number;
  operatingIncome: number;
  
  // Cash Flow
  cashOnHand: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  
  // Efficiency
  customerAcquisitionCost: number;
  lifetimeValue: number;
  ltvToCacRatio: number;
  
  // Status
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  healthScore: number; // 0-100
}

export interface GrowthMetrics {
  // Customer Growth
  totalCustomers: number;
  newCustomersThisPeriod: number;
  customerGrowthRate: number;
  churnRate: number;
  
  // Revenue Growth
  revenueGrowthRate: number;
  mrrGrowth: number;
  arrGrowth: number;
  
  // Market Expansion
  newMarketsEntered: number;
  marketSharePercent: number;
  
  // Pipeline
  pipelineValue: number;
  pipelineGrowth: number;
  conversionRate: number;
  
  // Status
  overallGrowth: 'accelerating' | 'steady' | 'slowing' | 'declining';
  growthScore: number; // 0-100
}

export interface OperationalMetrics {
  // Efficiency
  employeeProductivity: number;
  revenuePerEmployee: number;
  operatingEfficiency: number;
  
  // Quality
  customerSatisfaction: number;
  netPromoterScore: number;
  supportTicketResolutionTime: number;
  
  // Innovation
  newFeaturesReleased: number;
  productUptime: number;
  technicalDebt: number;
  
  // Team
  employeeSatisfaction: number;
  turnoverRate: number;
  hiringVelocity: number;
  
  // Status
  operationalHealth: 'excellent' | 'good' | 'fair' | 'poor';
  operationalScore: number; // 0-100
}

export interface MarketMetrics {
  // Position
  marketShare: number;
  competitivePosition: 'leader' | 'challenger' | 'follower' | 'niche';
  
  // Brand
  brandAwareness: number;
  brandSentiment: number;
  
  // Competition
  competitorCount: number;
  marketConcentration: number;
  
  // Trends
  marketGrowthRate: number;
  industryTrends: string[];
  
  // Status
  marketPosition: 'strong' | 'moderate' | 'weak';
  marketScore: number; // 0-100
}

export interface ExecutiveInsight {
  id: string;
  dashboardId: string;
  
  // Insight Details
  type: InsightType;
  title: string;
  description: string;
  
  // Impact
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  
  // Data
  relatedKPIs: string[];
  supportingData: Record<string, any>;
  
  // Action
  recommendedAction?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Status
  status: 'new' | 'reviewed' | 'actioned' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Date;
  
  createdAt: Date;
}

export interface ExecutiveRisk {
  id: string;
  dashboardId: string;
  
  // Risk Details
  title: string;
  description: string;
  category: 'financial' | 'operational' | 'market' | 'competitive' | 'regulatory';
  
  // Assessment
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // probability * impact
  
  // Mitigation
  mitigationPlan?: string;
  owner?: string;
  
  // Status
  status: 'identified' | 'monitoring' | 'mitigated' | 'occurred';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutiveOpportunity {
  id: string;
  dashboardId: string;
  
  // Opportunity Details
  title: string;
  description: string;
  category: 'market' | 'product' | 'partnership' | 'acquisition' | 'expansion';
  
  // Potential
  estimatedValue: number;
  probability: number; // 0-100
  timeHorizon: 'short' | 'medium' | 'long';
  
  // Requirements
  investmentRequired?: number;
  resourcesNeeded?: string[];
  
  // Status
  status: 'identified' | 'evaluating' | 'pursuing' | 'captured' | 'rejected';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OKR {
  id: string;
  dashboardId: string;
  
  // Objective
  title: string;
  description: string;
  category: 'financial' | 'growth' | 'operational' | 'customer' | 'innovation';
  
  // Key Results
  keyResults: KeyResult[];
  
  // Timeline
  startDate: Date;
  endDate: Date;
  
  // Progress
  overallProgress: number; // 0-100
  status: 'on_track' | 'at_risk' | 'off_track' | 'completed';
  
  // Ownership
  owner: string;
  team: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyResult {
  id: string;
  okrId: string;
  
  title: string;
  metric: string;
  
  // Targets
  baseline: number;
  target: number;
  current: number;
  
  // Progress
  progress: number; // 0-100
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutiveBriefing {
  id: string;
  dashboardId: string;
  tenantId: string;
  
  // Briefing Details
  title: string;
  period: string;
  frequency: BriefingFrequency;
  
  // Content
  executiveSummary: string;
  keyHighlights: string[];
  criticalIssues: string[];
  strategicRecommendations: string[];
  
  // Metrics Snapshot
  kpiSnapshot: Record<string, any>;
  financialSnapshot: FinancialHealthMetrics;
  
  // Insights
  topInsights: ExecutiveInsight[];
  topRisks: ExecutiveRisk[];
  topOpportunities: ExecutiveOpportunity[];
  
  // Delivery
  generatedAt: Date;
  deliveredAt?: Date;
  deliveredTo: string[];
  
  // Feedback
  reviewedBy?: string;
  feedback?: string;
  
  createdAt: Date;
}

export interface ExecutiveAlert {
  id: string;
  tenantId: string;
  
  // Alert Details
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'urgent';
  
  // Trigger
  triggerType: 'kpi_threshold' | 'trend_anomaly' | 'risk_event' | 'opportunity';
  triggerData: Record<string, any>;
  
  // Recipients
  recipients: string[];
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  
  createdAt: Date;
}