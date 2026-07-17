// src/backend/security/monitoring/SecurityMetricsEngine.ts
import { createClient } from "@supabase/supabase-js";
import { SecurityMetrics, ThreatSeverity, SecurityEventType } from "./SecurityMonitoringTypes";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class SecurityMetricsEngine {
  
  /**
   * Gets security metrics for a tenant
   */
  static async getMetrics(tenantId: string, period: string): Promise<SecurityMetrics> {
    const [startDate, endDate] = this.parsePeriod(period);
    
    // Get events in period
    const { data: events } = await supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('detected_at', startDate.toISOString())
      .lte('detected_at', endDate.toISOString());
    
    // Get incidents in period
    const { data: incidents } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('detected_at', startDate.toISOString())
      .lte('detected_at', endDate.toISOString());
    
    // Calculate metrics
    const totalEvents = events?.length || 0;
    
    // Events by severity
    const eventsBySeverity: Record<ThreatSeverity, number> = {
      'info': 0,
      'low': 0,
      'medium': 0,
      'high': 0,
      'critical': 0
    };
    
    for (const event of events || []) {
      eventsBySeverity[event.severity]++;
    }
    
    // Events by type
    const eventsByType: Record<string, number> = {};
    for (const event of events || []) {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
    }
    
    // Events by hour
    const eventsByHour = new Array(24).fill(0);
    for (const event of events || []) {
      const hour = new Date(event.detected_at).getHours();
      eventsByHour[hour]++;
    }
    
    // Threats
    const activeThreats = events?.filter(e => e.status === 'detected' || e.status === 'investigating').length || 0;
    const newThreatsToday = events?.filter(e => 
      new Date(e.detected_at).toDateString() === new Date().toDateString()
    ).length || 0;
    const mitigatedThreats = events?.filter(e => e.status === 'mitigated' || e.status === 'resolved').length || 0;
    const falsePositives = events?.filter(e => e.status === 'false_positive').length || 0;
    
    // Incidents
    const openIncidents = incidents?.filter(i => i.status === 'open' || i.status === 'investigating').length || 0;
    const newIncidentsToday = incidents?.filter(i => 
      new Date(i.detected_at).toDateString() === new Date().toDateString()
    ).length || 0;
    const resolvedIncidents = incidents?.filter(i => i.status === 'resolved' || i.status === 'closed').length || 0;
    
    // Calculate average resolution time
    const resolvedWithTime = incidents?.filter(i => i.detected_at && i.resolved_at) || [];
    const avgResolutionTimeHours = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, i) => {
          const hours = (new Date(i.resolved_at).getTime() - new Date(i.detected_at).getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / resolvedWithTime.length
      : 0;
    
    // Detection performance
    const detectionAccuracy = totalEvents > 0
      ? ((totalEvents - falsePositives) / totalEvents) * 100
      : 100;
    
    // Risk score (weighted average of severity)
    const severityWeights: Record<ThreatSeverity, number> = {
      'info': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'critical': 5
    };
    
    const totalWeight = events?.reduce((sum, e) => sum + severityWeights[e.severity], 0) || 0;
    const overallRiskScore = totalEvents > 0
      ? Math.min(100, Math.round((totalWeight / (totalEvents * 5)) * 100))
      : 0;
    
    // Risk trend (compare to previous period)
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const { count: previousEventCount } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('detected_at', previousPeriodStart.toISOString())
      .lt('detected_at', startDate.toISOString());
    
    const riskTrend = totalEvents > (previousEventCount || 0) * 1.1
      ? 'degrading'
      : totalEvents < (previousEventCount || 0) * 0.9
        ? 'improving'
        : 'stable';
    
    // Compliance score
    const policyViolations = events?.filter(e => 
      e.event_type === 'role_violation' || 
      e.event_type === 'permission_denied_spike'
    ).length || 0;
    
    const complianceScore = Math.max(0, 100 - (policyViolations * 5));
    
    // Top threats
    const topThreatTypes = Object.entries(eventsByType)
      .map(([type, count]) => ({ type: type as SecurityEventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Top threat actors
    const actorCounts: Record<string, number> = {};
    for (const event of events || []) {
      actorCounts[event.actor_id] = (actorCounts[event.actor_id] || 0) + 1;
    }
    
    const topThreatActors = Object.entries(actorCounts)
      .map(([actorId, count]) => ({ actorId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Top threat IPs
    const ipCounts: Record<string, number> = {};
    for (const event of events || []) {
      ipCounts[event.ip_address] = (ipCounts[event.ip_address] || 0) + 1;
    }
    
    const topThreatIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      tenantId,
      period,
      totalEvents,
      eventsBySeverity,
      eventsByType: eventsByType as any,
      eventsByHour,
      activeThreats,
      newThreatsToday,
      mitigatedThreats,
      falsePositives,
      openIncidents,
      newIncidentsToday,
      resolvedIncidents,
      averageResolutionTimeHours,
      detectionAccuracy,
      meanTimeToDetect: 0, // Would calculate from event timestamps
      meanTimeToRespond: 0,
      overallRiskScore,
      riskTrend,
      complianceScore,
      policyViolations,
      topThreatTypes,
      topThreatActors,
      topThreatIPs
    };
  }
  
  /**
   * Parses a period string into start and end dates
   */
  private static parsePeriod(period: string): [Date, Date] {
    // Handle different period formats
    if (period.includes('W')) {
      // Week format: "2026-W03"
      const [year, week] = period.split('-W').map(Number);
      const startDate = new Date(year, 0, 1 + (week - 1) * 7);
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return [startDate, endDate];
    } else {
      // Date format: "2026-01-17"
      const [year, month, day] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, day || 1);
      const endDate = day
        ? new Date(year, month - 1, day, 23, 59, 59)
        : new Date(year, month, 0, 23, 59, 59);
      return [startDate, endDate];
    }
  }
  
  /**
   * Gets real-time security dashboard data
   */
  static async getDashboard(tenantId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const metrics = await this.getMetrics(tenantId, today);
    
    // Get active threats
    const { data: activeThreats } = await supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['detected', 'investigating', 'confirmed'])
      .order('risk_score', { ascending: false })
      .limit(10);
    
    // Get active incidents
    const { data: activeIncidents } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['open', 'investigating', 'contained'])
      .order('detected_at', { ascending: false })
      .limit(10);
    
    // Get active alerts
    const { data: activeAlerts } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);
    
    return {
      metrics,
      activeThreats: activeThreats || [],
      activeIncidents: activeIncidents || [],
      activeAlerts: activeAlerts || [],
      lastUpdated: new Date()
    };
  }
}