export type DashboardView = 'executive' | 'manager' | 'team_member' | 'custom';
export type WidgetType = 'metric' | 'chart' | 'list' | 'feed' | 'calendar' | 'pipeline' | 'tasks' | 'meetings' | 'documents' | 'custom';
export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type MetricTrend = 'up' | 'down' | 'stable';

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  breakpoints: { lg: number; md: number; sm: number; xs: number };
}

export interface DashboardFilter { field: string; operator: string; value: any }

export interface WidgetConfig {
  metricName?: string;
  comparisonPeriod?: TimeRange;
  showTrend?: boolean;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  dataSeries?: string[];
  listType?: 'contacts' | 'deals' | 'tasks' | 'meetings' | 'documents';
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  feedType?: 'activity' | 'notifications' | 'updates';
  calendarView?: 'day' | 'week' | 'month';
  pipelineId?: string;
  customQuery?: string;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: WidgetConfig;
  dataSource: string;
  refreshIntervalSeconds?: number;
  lastRefreshedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  view: DashboardView;
  isDefault: boolean;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  defaultTimeRange: TimeRange;
  defaultFilters: DashboardFilter[];
  ownerId: string;
  sharedWith: string[];
  isPublic: boolean;
  lastViewedAt?: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMetric {
  name: string;
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  trend?: MetricTrend;
  unit?: string;
  format?: 'number' | 'currency' | 'percent';
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  actor?: string;
  timestamp: Date;
  entityType?: string;
  entityId?: string;
}

export interface DashboardData {
  dashboard: Dashboard | null;
  metrics: DashboardMetric[];
  recentActivities: DashboardActivity[];
  upcomingMeetings: any[];
  openTasks: any[];
  pipelineSnapshot: any;
  projectOverview: any;
  widgetData: Record<string, any>;
  generatedAt: Date;
  timeRange: TimeRange;
  filters: any[];
}