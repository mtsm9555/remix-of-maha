// src/backend/security/threat/ThreatScoringEngine.ts
import { createClient } from "@supabase/supabase-js";
import { ThreatScore } from "./ThreatDetectionTypes";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class ThreatScoringEngine {
  
  /**
   * Calculates threat score for an entity
   */
  static async calculateThreatScore(
    tenantId: string,
    entityId: string,
    entityType: 'user' | 'agent' | 'ip' | 'domain' | 'api_key'
  ): Promise<ThreatScore> {
    console.log(`[ThreatScoring] Calculating score for ${entityType}:${entityId}`);
    
    // Gather risk factors
    const [
      behavioralRisk,
      reputationRisk,
      iocHitRisk,
      anomalyRisk
    ] = await Promise.all([
      this.calculateBehavioralRisk(tenantId, entityId, entityType),
      this.calculateReputationRisk(tenantId, entityId, entityType),
      this.calculateIOCHitRisk(tenantId, entityId, entityType),
      this.calculateAnomalyRisk(tenantId, entityId, entityType)
    ]);
    
    // Calculate overall risk score (weighted average)
    const weights = {
      behavioral: 0.30,
      reputation: 0.25,
      ioc: 0.25,
      anomaly: 0.20
    };
    
    const overallRiskScore = Math.round(
      behavioralRisk * weights.behavioral +
      reputationRisk * weights.reputation +
      iocHitRisk * weights.ioc +
      anomalyRisk * weights.anomaly
    );
    
    // Identify contributing factors
    const contributingFactors = [
      { factor: 'Behavioral Risk', weight: weights.behavioral, score: behavioralRisk },
      { factor: 'Reputation Risk', weight: weights.reputation, score: reputationRisk },
      { factor: 'IOC Hit Risk', weight: weights.ioc, score: iocHitRisk },
      { factor: 'Anomaly Risk', weight: weights.anomaly, score: anomalyRisk }
    ].filter(f => f.score > 0);
    
    // Get previous score for trend calculation
    const { data: previousScore } = await supabase
      .from('threat_scores')
      .select('overall_risk_score')
      .eq('tenant_id', tenantId)
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();
    
    const trendChange = previousScore
      ? ((overallRiskScore - previousScore.overall_risk_score) / previousScore.overall_risk_score) * 100
      : 0;
    
    const trend = trendChange > 10 ? 'degrading' : trendChange < -10 ? 'improving' : 'stable';
    
    const score: ThreatScore = {
      entityId,
      entityType,
      tenantId,
      overallRiskScore,
      behavioralRiskScore: behavioralRisk,
      reputationRiskScore: reputationRisk,
      iocHitScore: iocHitRisk,
      contributingFactors,
      trend,
      trendChange,
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };
    
    // Store score
    await supabase.from('threat_scores').insert({
      ...score,
      contributing_factors: score.contributingFactors,
      calculated_at: score.calculatedAt.toISOString(),
      expires_at: score.expiresAt.toISOString()
    });
    
    console.log(`[ThreatScoring] Score for ${entityType}:${entityId}: ${overallRiskScore}/100 (${trend})`);
    return score;
  }
  
  /**
   * Calculates behavioral risk score
   */
  private static async calculateBehavioralRisk(
    tenantId: string,
    entityId: string,
    entityType: string
  ): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: anomalies } = await supabase
      .from('behavioral_anomalies')
      .select('severity, risk_score')
      .eq('tenant_id', tenantId)
      .eq('entity_id', entityId)
      .gte('detected_at', sevenDaysAgo.toISOString());
    
    if (!anomalies || anomalies.length === 0) return 0;
    
    const severityWeights: Record<string, number> = {
      'low': 10,
      'medium': 25,
      'high': 50,
      'critical': 80
    };
    
    const totalWeight = anomalies.reduce((sum, a) => sum + (severityWeights[a.severity] || 0), 0);
    return Math.min(100, totalWeight);
  }
  
  /**
   * Calculates reputation risk score
   */
  private static async calculateReputationRisk(
    tenantId: string,
    entityId: string,
    entityType: string
  ): Promise<number> {
    // Check for security events
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: events } = await supabase
      .from('security_events')
      .select('severity, risk_score')
      .eq('tenant_id', tenantId)
      .eq('actor_id', entityId)
      .gte('detected_at', sevenDaysAgo.toISOString());
    
    if (!events || events.length === 0) return 0;
    
    const severityWeights: Record<string, number> = {
      'info': 5,
      'low': 15,
      'medium': 35,
      'high': 60,
      'critical': 90
    };
    
    const totalWeight = events.reduce((sum, e) => sum + (severityWeights[e.severity] || 0), 0);
    return Math.min(100, totalWeight);
  }
  
  /**
   * Calculates IOC hit risk score
   */
  private static async calculateIOCHitRisk(
    tenantId: string,
    entityId: string,
    entityType: string
  ): Promise<number> {
    // Check if entity is associated with any IOCs
    const { data: iocHits } = await supabase
      .from('security_events')
      .select('details')
      .eq('tenant_id', tenantId)
      .eq('actor_id', entityId)
      .eq('event_type', 'known_malicious_ip');
    
    if (!iocHits || iocHits.length === 0) return 0;
    
    // Each IOC hit adds significant risk
    return Math.min(100, iocHits.length * 40);
  }
  
  /**
   * Calculates anomaly risk score
   */
  private static async calculateAnomalyRisk(
    tenantId: string,
    entityId: string,
    entityType: string
  ): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: anomalies } = await supabase
      .from('behavioral_anomalies')
      .select('deviation_score, risk_score')
      .eq('tenant_id', tenantId)
      .eq('entity_id', entityId)
      .gte('detected_at', sevenDaysAgo.toISOString());
    
    if (!anomalies || anomalies.length === 0) return 0;
    
    // Use the maximum deviation score
    const maxDeviation = Math.max(...anomalies.map(a => Math.abs(a.deviation_score)));
    return Math.min(100, maxDeviation * 15);
  }
  
  /**
   * Gets top threat scores for a tenant
   */
  static async getTopThreats(tenantId: string, limit: number = 20): Promise<ThreatScore[]> {
    const { data } = await supabase
      .from('threat_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('expires_at', new Date().toISOString())
      .order('overall_risk_score', { ascending: false })
      .limit(limit);
    
    return (data || []).map((s: any) => ({
      ...s,
      contributingFactors: s.contributing_factors || [],
      calculatedAt: new Date(s.calculated_at),
      expiresAt: new Date(s.expires_at)
    }));
  }
}