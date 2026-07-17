// src/backend/security/monitoring/ThreatDetectionEngine.ts
import { createClient } from "@supabase/supabase-js";
import { SecurityEvent, SecurityEventType, SecurityRule, ThreatSeverity } from "./SecurityMonitoringTypes";
import { SecurityAlertManager } from "./SecurityAlertManager.server";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class ThreatDetectionEngine {
  private static ruleCache: SecurityRule[] = [];
  private static lastRuleRefresh: Date = new Date(0);
  private static readonly RULE_CACHE_TTL_MS = 60000; // 1 minute
  
  /**
   * Analyzes a security event for threats
   */
  static async analyzeEvent(event: SecurityEvent): Promise<void> {
    // 1. Check against threat intelligence
    await this.checkThreatIntelligence(event);
    
    // 2. Check against security rules
    await this.checkSecurityRules(event);
    
    // 3. Run anomaly detection
    await this.runAnomalyDetection(event);
    
    // 4. Check for patterns (multiple events)
    await this.checkEventPatterns(event);
  }
  
  /**
   * Checks event against threat intelligence feeds
   */
  private static async checkThreatIntelligence(event: SecurityEvent): Promise<void> {
    // Check if IP is in threat intelligence
    const { data: maliciousIP } = await supabase
      .from('threat_intelligence')
      .select('*')
      .eq('type', 'ip')
      .eq('value', event.ipAddress)
      .eq('is_active', true)
      .single();
    
    if (maliciousIP) {
      // Create high-severity event
      await this.createThreatEvent(
        event,
        'known_malicious_ip',
        'critical',
        `IP address ${event.ipAddress} is in threat intelligence feed: ${maliciousIP.description}`,
        maliciousIP.id
      );
    }
    
    // Check for Tor exit nodes (simplified)
    if (event.ipAddress.startsWith('185.220.')) {
      await this.createThreatEvent(
        event,
        'tor_exit_node_access',
        'medium',
        `Access from Tor exit node: ${event.ipAddress}`
      );
    }
  }
  
  /**
   * Checks event against security rules
   */
  private static async checkSecurityRules(event: SecurityEvent): Promise<void> {
    const rules = await this.getActiveRules(event.tenantId);
    
    for (const rule of rules) {
      if (rule.eventType !== event.eventType) continue;
      
      // Check if rule conditions are met
      const conditionsMet = this.evaluateRuleConditions(rule, event);
      
      if (conditionsMet) {
        // Check time window and threshold
        const eventCount = await this.countEventsInWindow(
          event.tenantId,
          event.eventType,
          event.actorId,
          rule.timeWindowMinutes
        );
        
        if (eventCount >= rule.threshold) {
          // Rule triggered
          await this.handleRuleTrigger(rule, event, eventCount);
        }
      }
    }
  }
  
  /**
   * Evaluates rule conditions against an event
   */
  private static evaluateRuleConditions(rule: SecurityRule, event: SecurityEvent): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true;
    }
    
    const results = rule.conditions.map(condition => {
      const value = this.resolveField(condition.field, event);
      
      switch (condition.operator) {
        case 'eq': return value === condition.value;
        case 'neq': return value !== condition.value;
        case 'gt': return value > condition.value;
        case 'lt': return value < condition.value;
        case 'gte': return value >= condition.value;
        case 'lte': return value <= condition.value;
        case 'in': return condition.value.includes(value);
        case 'contains': return String(value).includes(condition.value);
        case 'regex': return new RegExp(condition.value).test(String(value));
        default: return false;
      }
    });
    
    return rule.logic === 'AND'
      ? results.every(r => r)
      : results.some(r => r);
  }
  
  /**
   * Resolves a field value from an event
   */
  private static resolveField(field: string, event: SecurityEvent): any {
    const parts = field.split('.');
    let value: any = event;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Counts events in a time window
   */
  private static async countEventsInWindow(
    tenantId: string,
    eventType: string,
    actorId: string,
    windowMinutes: number
  ): Promise<number> {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const { count } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('event_type', eventType)
      .eq('actor_id', actorId)
      .gte('detected_at', cutoff.toISOString());
    
    return count || 0;
  }
  
  /**
   * Handles a triggered rule
   */
  private static async handleRuleTrigger(
    rule: SecurityRule,
    event: SecurityEvent,
    eventCount: number
  ): Promise<void> {
    console.log(`[ThreatDetection] Rule triggered: ${rule.name} (${eventCount} events in ${rule.timeWindowMinutes}min)`);
    
    // Update event with rule info
    await supabase
      .from('security_events')
      .update({
        rule_id: rule.id,
        detection_method: 'rule',
        event_count: eventCount
      })
      .eq('id', event.id);
    
    // Create alert
    await SecurityAlertManager.createAlert({
      tenantId: event.tenantId,
      title: `Rule Triggered: ${rule.name}`,
      description: `${eventCount} events of type '${event.eventType}' detected in ${rule.timeWindowMinutes} minutes`,
      severity: rule.severity,
      category: rule.eventType,
      triggerEventId: event.id,
      triggerRuleId: rule.id,
      relatedEventIds: [event.id],
      notificationChannels: rule.notifyChannels
    });
    
    // Auto-mitigate if configured
    if (rule.autoMitigate && rule.mitigationAction) {
      await this.executeMitigation(rule.mitigationAction, event);
    }
  }
  
  /**
   * Runs anomaly detection on an event
   */
  private static async runAnomalyDetection(event: SecurityEvent): Promise<void> {
    // Check for unusual login location
    if (event.eventType === 'suspicious_login_location') {
      await this.detectImpossibleTravel(event);
    }
    
    // Check for unusual data access patterns
    if (event.eventType === 'unusual_data_access') {
      await this.detectDataAccessAnomaly(event);
    }
    
    // Check for unusual API patterns
    if (event.eventType === 'unusual_api_pattern') {
      await this.detectAPIAnomaly(event);
    }
  }
  
  /**
   * Detects impossible travel (login from two distant locations in short time)
   */
  private static async detectImpossibleTravel(event: SecurityEvent): Promise<void> {
    // Get previous login for this user
    const { data: previousLogins } = await supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', event.tenantId)
      .eq('actor_id', event.actorId)
      .in('event_type', ['suspicious_login_location', 'brute_force_attempt'])
      .order('detected_at', { ascending: false })
      .limit(1);
    
    if (!previousLogins || previousLogins.length === 0) return;
    
    const previousLogin = previousLogins[0];
    const timeDiffMinutes = (event.detectedAt.getTime() - new Date(previousLogin.detected_at).getTime()) / (1000 * 60);
    
    // If login happened within 30 minutes from a different country
    if (timeDiffMinutes < 30 && previousLogin.country !== event.country) {
      await this.createThreatEvent(
        event,
        'impossible_travel',
        'high',
        `User logged in from ${previousLogin.country} and ${event.country} within ${timeDiffMinutes.toFixed(0)} minutes`
      );
    }
  }
  
  /**
   * Detects data access anomalies
   */
  private static async detectDataAccessAnomaly(event: SecurityEvent): Promise<void> {
    // Get user's typical data access pattern
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: historicalAccess } = await supabase
      .from('security_events')
      .select('event_count')
      .eq('tenant_id', event.tenantId)
      .eq('actor_id', event.actorId)
      .eq('event_type', 'unusual_data_access')
      .gte('detected_at', thirtyDaysAgo.toISOString());
    
    if (!historicalAccess || historicalAccess.length === 0) return;
    
    // Calculate average
    const avgAccess = historicalAccess.reduce((sum, e) => sum + (e.event_count || 1), 0) / historicalAccess.length;
    
    // If current access is 3x the average
    if (event.eventCount > avgAccess * 3) {
      await this.createThreatEvent(
        event,
        'data_exfiltration_attempt',
        'high',
        `Data access (${event.eventCount}) is ${((event.eventCount / avgAccess) * 100).toFixed(0)}% above user's average (${avgAccess.toFixed(0)})`
      );
    }
  }
  
  /**
   * Detects API usage anomalies
   */
  private static async detectAPIAnomaly(event: SecurityEvent): Promise<void> {
    // Similar to data access anomaly detection
    // Check if API usage is significantly above normal
  }
  
  /**
   * Checks for event patterns
   */
  private static async checkEventPatterns(event: SecurityEvent): Promise<void> {
    // Check for brute force pattern (multiple failed logins)
    if (event.eventType === 'brute_force_attempt') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const { count } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', event.tenantId)
        .eq('event_type', 'brute_force_attempt')
        .eq('ip_address', event.ipAddress)
        .gte('detected_at', fiveMinutesAgo.toISOString());
      
      if (count && count >= 10) {
        await this.createThreatEvent(
          event,
          'brute_force_attempt',
          'critical',
          `Brute force attack: ${count} failed login attempts from ${event.ipAddress} in 5 minutes`
        );
      }
    }
  }
  
  /**
   * Creates a threat event
   */
  private static async createThreatEvent(
    originalEvent: SecurityEvent,
    eventType: SecurityEventType,
    severity: ThreatSeverity,
    description: string,
    threatIntelId?: string
  ): Promise<void> {
    const threatEvent: SecurityEvent = {
      ...originalEvent,
      id: `sec_${crypto.randomUUID()}`,
      eventType,
      severity,
      title: originalEvent.title,
      description,
      detectionMethod: 'anomaly',
      confidenceScore: 0.9,
      riskScore: 85,
      status: 'detected',
      detectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await supabase.from('security_events').insert({
      ...threatEvent,
      detected_at: threatEvent.detectedAt.toISOString(),
      created_at: threatEvent.createdAt.toISOString(),
      updated_at: threatEvent.updatedAt.toISOString()
    });
    
    // Create alert
    await SecurityAlertManager.createAlert({
      tenantId: originalEvent.tenantId,
      title: threatEvent.title,
      description,
      severity,
      category: eventType,
      triggerEventId: threatEvent.id,
      relatedEventIds: [originalEvent.id, threatEvent.id],
      notificationChannels: ['email', 'slack']
    });
  }
  
  /**
   * Executes mitigation action
   */
  private static async executeMitigation(action: string, event: SecurityEvent): Promise<void> {
    console.log(`[ThreatDetection] Executing mitigation: ${action} for event ${event.id}`);
    
    switch (action) {
      case 'block_ip':
        // In production, update firewall rules
        console.log(`[ThreatDetection] Would block IP: ${event.ipAddress}`);
        break;
      
      case 'disable_user':
        // In production, disable user account
        console.log(`[ThreatDetection] Would disable user: ${event.actorId}`);
        break;
      
      case 'revoke_session':
        // In production, revoke user session
        console.log(`[ThreatDetection] Would revoke session: ${event.sessionId}`);
        break;
      
      default:
        console.log(`[ThreatDetection] Unknown mitigation action: ${action}`);
    }
  }
  
  /**
   * Gets active security rules
   */
  private static async getActiveRules(tenantId: string): Promise<SecurityRule[]> {
    const now = new Date();
    if (now.getTime() - this.lastRuleRefresh.getTime() < this.RULE_CACHE_TTL_MS && this.ruleCache.length > 0) {
      return this.ruleCache;
    }
    
    const { data } = await supabase
      .from('security_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('priority', { ascending: true });
    
    this.ruleCache = (data || []).map((r: any) => ({
      ...r,
      conditions: r.conditions || [],
      notifyChannels: r.notify_channels || [],
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at)
    }));
    
    this.lastRuleRefresh = now;
    return this.ruleCache;
  }
}