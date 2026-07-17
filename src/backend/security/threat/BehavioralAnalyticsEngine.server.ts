// src/backend/security/threat/BehavioralAnalyticsEngine.ts
import { createClient } from "@supabase/supabase-js";
import { BehavioralBaseline, BehavioralAnomaly, BehavioralMetric } from "./ThreatDetectionTypes";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class BehavioralAnalyticsEngine {
  
  /**
   * Builds or updates a behavioral baseline for an entity
   */
  static async buildBaseline(
    tenantId: string,
    entityId: string,
    entityType: 'user' | 'agent' | 'api_key' | 'service_account',
    lookbackDays: number = 30
  ): Promise<BehavioralBaseline> {
    console.log(`[UEBA] Building baseline for ${entityType}:${entityId}`);
    
    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    
    // Fetch historical activity
    const { data: events } = await supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('actor_id', entityId)
      .gte('detected_at', startDate.toISOString());
    
    if (!events || events.length < 10) {
      throw new Error('Insufficient data to build baseline (need at least 10 events)');
    }
    
    // Calculate metrics
    const metrics = await this.calculateMetrics(events);
    
    // Calculate temporal patterns
    const hourlyPatterns = this.calculateHourlyPatterns(events);
    const dayOfWeekPatterns = this.calculateDayOfWeekPatterns(events);
    
    // Extract common patterns
    const commonLocations = this.extractCommonValues(events, 'country');
    const commonIPs = this.extractCommonValues(events, 'ip_address');
    const commonUserAgents = this.extractCommonValues(events, 'user_agent');
    
    const baseline: BehavioralBaseline = {
      id: `baseline_${crypto.randomUUID()}`,
      tenantId,
      entityId,
      entityType,
      metrics,
      hourlyPatterns,
      dayOfWeekPatterns,
      commonLocations,
      commonIPs,
      commonUserAgents,
      baselinePeriod: { start: startDate, end: new Date() },
      confidence: Math.min(1.0, events.length / 100), // Confidence increases with sample size
      sampleSize: events.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    // Upsert baseline
    await supabase.from('behavioral_baselines').upsert({
      ...baseline,
      hourly_patterns: baseline.hourlyPatterns,
      day_of_week_patterns: baseline.dayOfWeekPatterns,
      common_locations: baseline.commonLocations,
      common_ips: baseline.commonIPs,
      common_user_agents: baseline.commonUserAgents,
      baseline_period: baseline.baselinePeriod,
      created_at: baseline.createdAt.toISOString(),
      updated_at: baseline.updatedAt.toISOString(),
      expires_at: baseline.expiresAt.toISOString()
    }, { onConflict: 'tenant_id,entity_id,entity_type' });
    
    console.log(`[UEBA] ✅ Baseline built for ${entityType}:${entityId} (${events.length} samples)`);
    return baseline;
  }
  
  /**
   * Analyzes current activity against baseline
   */
  static async analyzeActivity(
    tenantId: string,
    entityId: string,
    entityType: string,
    currentMetrics: Record<string, number>,
    context: Record<string, any>
  ): Promise<BehavioralAnomaly[]> {
    // Get baseline
    const { data: baseline } = await supabase
      .from('behavioral_baselines')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (!baseline) {
      // No baseline yet, build one
      await this.buildBaseline(tenantId, entityId, entityType as any);
      return [];
    }
    
    const anomalies: BehavioralAnomaly[] = [];
    
    // Check each metric
    for (const [metricName, currentValue] of Object.entries(currentMetrics)) {
      const baselineMetric = baseline.metrics[metricName];
      
      if (!baselineMetric) continue;
      
      // Calculate Z-score
      const zScore = baselineMetric.standardDeviation > 0
        ? (currentValue - baselineMetric.mean) / baselineMetric.standardDeviation
        : 0;
      
      // Check for anomaly (Z-score > 3 is typically considered anomalous)
      if (Math.abs(zScore) > 3) {
        const anomaly = await this.createAnomaly(
          tenantId,
          baseline.id,
          entityId,
          entityType,
          metricName as BehavioralMetric,
          currentValue,
          baselineMetric.mean,
          zScore,
          context
        );
        
        anomalies.push(anomaly);
      }
    }
    
    // Check temporal patterns
    const currentHour = new Date().getHours();
    const currentDayOfWeek = new Date().getDay();
    
    const hourlyAvg = baseline.hourly_patterns[currentHour] || 0;
    const dayOfWeekAvg = baseline.day_of_week_patterns[currentDayOfWeek] || 0;
    
    // If activity is significantly outside normal pattern
    if (hourlyAvg === 0 && Object.values(baseline.hourly_patterns).some(v => v > 0)) {
      anomalies.push(await this.createAnomaly(
        tenantId,
        baseline.id,
        entityId,
        entityType,
        'time_of_day_pattern',
        1,
        0,
        5,
        { hour: currentHour, description: 'Activity at unusual hour' }
      ));
    }
    
    // Check location anomaly
    if (context.country && !baseline.common_locations.includes(context.country)) {
      anomalies.push(await this.createAnomaly(
        tenantId,
        baseline.id,
        entityId,
        entityType,
        'geographic_pattern',
        1,
        0,
        4,
        { country: context.country, commonLocations: baseline.common_locations }
      ));
    }
    
    return anomalies;
  }
  
  /**
   * Calculates behavioral metrics from events
   */
  private static async calculateMetrics(events: any[]): Promise<Record<BehavioralMetric, any>> {
    const metrics: Record<string, number[]> = {
      login_frequency: [],
      data_access_volume: [],
      api_call_rate: [],
      file_download_count: [],
      session_duration: []
    };
    
    // Group events by day
    const eventsByDay: Record<string, any[]> = {};
    for (const event of events) {
      const day = new Date(event.detected_at).toDateString();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(event);
    }
    
    // Calculate daily metrics
    for (const dayEvents of Object.values(eventsByDay)) {
      metrics.login_frequency.push(dayEvents.filter(e => e.event_type?.includes('login')).length);
      metrics.data_access_volume.push(dayEvents.filter(e => e.event_type?.includes('data')).length);
      metrics.api_call_rate.push(dayEvents.filter(e => e.event_type?.includes('api')).length);
      metrics.file_download_count.push(dayEvents.filter(e => e.event_type?.includes('download')).length);
    }
    
    // Calculate statistics
    const result: Record<string, any> = {};
    
    for (const [metricName, values] of Object.entries(metrics)) {
      if (values.length === 0) continue;
      
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      const sorted = [...values].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      
      result[metricName] = {
        mean,
        standardDeviation: stdDev,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[p95Index] || sorted[sorted.length - 1],
        p99: sorted[p99Index] || sorted[sorted.length - 1],
        samples: values.length
      };
    }
    
    return result as Record<BehavioralMetric, any>;
  }
  
  /**
   * Calculates hourly activity patterns
   */
  private static calculateHourlyPatterns(events: any[]): number[] {
    const hourlyCounts = new Array(24).fill(0);
    
    for (const event of events) {
      const hour = new Date(event.detected_at).getHours();
      hourlyCounts[hour]++;
    }
    
    // Normalize to percentages
    const total = hourlyCounts.reduce((sum, c) => sum + c, 0);
    return hourlyCounts.map(c => total > 0 ? (c / total) * 100 : 0);
  }
  
  /**
   * Calculates day-of-week activity patterns
   */
  private static calculateDayOfWeekPatterns(events: any[]): number[] {
    const dayCounts = new Array(7).fill(0);
    
    for (const event of events) {
      const day = new Date(event.detected_at).getDay();
      dayCounts[day]++;
    }
    
    const total = dayCounts.reduce((sum, c) => sum + c, 0);
    return dayCounts.map(c => total > 0 ? (c / total) * 100 : 0);
  }
  
  /**
   * Extracts common values from events
   */
  private static extractCommonValues(events: any[], field: string): string[] {
    const counts: Record<string, number> = {};
    
    for (const event of events) {
      const value = event[field];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    }
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value]) => value);
  }
  
  /**
   * Creates an anomaly record
   */
  private static async createAnomaly(
    tenantId: string,
    baselineId: string,
    entityId: string,
    entityType: string,
    metric: BehavioralMetric,
    currentValue: number,
    baselineValue: number,
    deviationScore: number,
    context: Record<string, any>
  ): Promise<BehavioralAnomaly> {
    const severity = this.calculateSeverity(deviationScore);
    const riskScore = Math.min(100, Math.round(Math.abs(deviationScore) * 15));
    
    const anomaly: BehavioralAnomaly = {
      id: `anomaly_${crypto.randomUUID()}`,
      tenantId,
      baselineId,
      entityId,
      entityType,
      metric,
      currentValue,
      baselineValue,
      deviationScore,
      severity,
      anomalyType: this.classifyAnomalyType(metric, currentValue, baselineValue),
      context,
      contributingFactors: this.identifyContributingFactors(metric, context),
      riskScore,
      potentialThreat: this.assessPotentialThreat(metric, severity),
      detectedAt: new Date(),
      createdAt: new Date()
    };
    
    await supabase.from('behavioral_anomalies').insert({
      ...anomaly,
      detected_at: anomaly.detectedAt.toISOString(),
      created_at: anomaly.createdAt.toISOString()
    });
    
    console.log(`[UEBA] ⚠️ Anomaly detected: ${metric} for ${entityType}:${entityId} (Z-score: ${deviationScore.toFixed(2)})`);
    return anomaly;
  }
  
  /**
   * Calculates severity based on deviation score
   */
  private static calculateSeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    const absZ = Math.abs(zScore);
    
    if (absZ >= 6) return 'critical';
    if (absZ >= 4) return 'high';
    if (absZ >= 3) return 'medium';
    return 'low';
  }
  
  /**
   * Classifies anomaly type
   */
  private static classifyAnomalyType(
    metric: BehavioralMetric,
    currentValue: number,
    baselineValue: number
  ): 'spike' | 'drop' | 'pattern_break' | 'location_anomaly' | 'temporal_anomaly' {
    if (metric === 'geographic_pattern') return 'location_anomaly';
    if (metric === 'time_of_day_pattern') return 'temporal_anomaly';
    
    if (currentValue > baselineValue * 2) return 'spike';
    if (currentValue < baselineValue * 0.5) return 'drop';
    return 'pattern_break';
  }
  
  /**
   * Identifies contributing factors
   */
  private static identifyContributingFactors(metric: BehavioralMetric, context: Record<string, any>): string[] {
    const factors: string[] = [];
    
    if (context.ip_address) factors.push(`IP: ${context.ip_address}`);
    if (context.country) factors.push(`Location: ${context.country}`);
    if (context.user_agent) factors.push(`User Agent: ${context.user_agent.substring(0, 50)}`);
    if (context.time) factors.push(`Time: ${context.time}`);
    
    return factors;
  }
  
  /**
   * Assesses potential threat based on anomaly
   */
  private static assessPotentialThreat(metric: BehavioralMetric, severity: string): string {
    const threats: Record<BehavioralMetric, string> = {
      'login_frequency': 'Potential credential stuffing or account takeover',
      'data_access_volume': 'Potential data exfiltration',
      'api_call_rate': 'Potential API abuse or automated attack',
      'file_download_count': 'Potential data theft',
      'session_duration': 'Potential unauthorized session',
      'geographic_pattern': 'Potential account compromise',
      'time_of_day_pattern': 'Potential unauthorized access',
      'tool_usage_pattern': 'Potential insider threat'
    };
    
    return threats[metric] || 'Behavioral anomaly requiring investigation';
  }
  
  /**
   * Gets anomalies for an entity
   */
  static async getEntityAnomalies(
    tenantId: string,
    entityId: string,
    days: number = 7
  ): Promise<BehavioralAnomaly[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('behavioral_anomalies')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('entity_id', entityId)
      .gte('detected_at', startDate.toISOString())
      .order('detected_at', { ascending: false });
    
    return (data || []).map((a: any) => ({
      ...a,
      detectedAt: new Date(a.detected_at),
      createdAt: new Date(a.created_at)
    }));
  }
}