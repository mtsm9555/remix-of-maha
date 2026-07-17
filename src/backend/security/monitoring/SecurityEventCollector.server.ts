// src/backend/security/monitoring/SecurityEventCollector.ts
import { createClient } from "@supabase/supabase-js";
import { SecurityEvent, SecurityEventType, ThreatSeverity } from "./SecurityMonitoringTypes";
import { ThreatDetectionEngine } from "./ThreatDetectionEngine.server";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class SecurityEventCollector {
  private static eventBuffer: SecurityEvent[] = [];
  private static readonly BUFFER_SIZE = 50;
  private static readonly FLUSH_INTERVAL_MS = 3000;
  private static flushInterval: NodeJS.Timeout | null = null;
  
  /**
   * Initializes the security event collector
   */
  static initialize(): void {
    console.log('[SecurityEventCollector] Initializing');
    
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, this.FLUSH_INTERVAL_MS);
  }
  
  /**
   * Shuts down the collector
   */
  static shutdown(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushBuffer();
  }
  
  /**
   * Collects a security event
   */
  static async collect(
    eventType: SecurityEventType,
    severity: ThreatSeverity,
    tenantId: string,
    actor: {
      id: string;
      type: 'user' | 'agent' | 'api_key' | 'system' | 'unknown';
      email?: string;
      name?: string;
    },
    context: {
      workspaceId?: string;
      ipAddress: string;
      userAgent: string;
      sessionId?: string;
      correlationId?: string;
      details?: Record<string, any>;
      metadata?: Record<string, any>;
    }
  ): Promise<SecurityEvent> {
    // Get geolocation for IP
    const geo = await this.getGeolocation(context.ipAddress);
    
    const event: SecurityEvent = {
      id: `sec_${crypto.randomUUID()}`,
      tenantId,
      workspaceId: context.workspaceId,
      eventType,
      severity,
      title: this.generateTitle(eventType),
      description: this.generateDescription(eventType, context.details),
      actorId: actor.id,
      actorType: actor.type,
      actorEmail: actor.email,
      actorName: actor.name,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      correlationId: context.correlationId,
      country: geo?.country,
      city: geo?.city,
      latitude: geo?.latitude,
      longitude: geo?.longitude,
      detectionMethod: 'rule',
      confidenceScore: 1.0,
      relatedEventIds: [],
      eventCount: 1,
      riskScore: this.calculateRiskScore(eventType, severity),
      potentialImpact: this.assessImpact(eventType),
      recommendedAction: this.recommendAction(eventType),
      details: context.details || {},
      metadata: context.metadata || {},
      status: 'detected',
      detectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to buffer
    this.eventBuffer.push(event);
    
    // Flush if buffer is full
    if (this.eventBuffer.length >= this.BUFFER_SIZE) {
      await this.flushBuffer();
    }
    
    // Run threat detection asynchronously
    ThreatDetectionEngine.analyzeEvent(event).catch((err: any) => {
      console.error('[SecurityEventCollector] Threat detection failed:', err);
    });
    
    return event;
  }
  
  /**
   * Flushes the event buffer to database
   */
  private static async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;
    
    const batch = [...this.eventBuffer];
    this.eventBuffer = [];
    
    try {
      const rows = batch.map(event => ({
        id: event.id,
        tenant_id: event.tenantId,
        workspace_id: event.workspaceId,
        event_type: event.eventType,
        severity: event.severity,
        title: event.title,
        description: event.description,
        actor_id: event.actorId,
        actor_type: event.actorType,
        actor_email: event.actorEmail,
        actor_name: event.actorName,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        session_id: event.sessionId,
        correlation_id: event.correlationId,
        country: event.country,
        city: event.city,
        latitude: event.latitude,
        longitude: event.longitude,
        detection_method: event.detectionMethod,
        confidence_score: event.confidenceScore,
        rule_id: event.ruleId,
        related_event_ids: event.relatedEventIds,
        event_count: event.eventCount,
        risk_score: event.riskScore,
        potential_impact: event.potentialImpact,
        recommended_action: event.recommendedAction,
        details: event.details,
        metadata: event.metadata,
        status: event.status,
        detected_at: event.detectedAt.toISOString(),
        created_at: event.createdAt.toISOString(),
        updated_at: event.updatedAt.toISOString()
      }));
      
      const { error } = await supabase.from('security_events').insert(rows);
      
      if (error) {
        console.error('[SecurityEventCollector] Failed to flush events:', error);
        this.eventBuffer.unshift(...batch);
      } else {
        console.log(`[SecurityEventCollector] Flushed ${batch.length} security events`);
      }
    } catch (error) {
      console.error('[SecurityEventCollector] Error flushing events:', error);
      this.eventBuffer.unshift(...batch);
    }
  }
  
  /**
   * Gets geolocation for an IP address
   */
  private static async getGeolocation(ip: string): Promise<{
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null> {
    // In production, use a geolocation service (MaxMind, IP-API, etc.)
    // For this architecture, return mock data
    return {
      country: 'United States',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194
    };
  }
  
  /**
   * Generates a title for the event
   */
  private static generateTitle(eventType: SecurityEventType): string {
    const titles: Record<SecurityEventType, string> = {
      'brute_force_attempt': 'Brute Force Attack Detected',
      'credential_stuffing': 'Credential Stuffing Attempt',
      'impossible_travel': 'Impossible Travel Detected',
      'suspicious_login_location': 'Suspicious Login Location',
      'failed_mfa_attempts': 'Multiple MFA Failures',
      'account_lockout': 'Account Lockout',
      'privilege_escalation_attempt': 'Privilege Escalation Attempt',
      'unauthorized_access_attempt': 'Unauthorized Access Attempt',
      'role_violation': 'Role Violation',
      'permission_denied_spike': 'Permission Denied Spike',
      'suspicious_role_assignment': 'Suspicious Role Assignment',
      'data_exfiltration_attempt': 'Data Exfiltration Attempt',
      'unusual_data_access': 'Unusual Data Access Pattern',
      'bulk_data_download': 'Bulk Data Download',
      'sensitive_data_access': 'Sensitive Data Access',
      'encryption_key_misuse': 'Encryption Key Misuse',
      'api_abuse': 'API Abuse Detected',
      'rate_limit_violation': 'Rate Limit Violation',
      'injection_attempt': 'Injection Attempt',
      'unusual_api_pattern': 'Unusual API Pattern',
      'endpoint_scanning': 'Endpoint Scanning',
      'suspicious_ip_activity': 'Suspicious IP Activity',
      'tor_exit_node_access': 'Tor Exit Node Access',
      'known_malicious_ip': 'Known Malicious IP',
      'geo_anomaly': 'Geographic Anomaly',
      'device_fingerprint_anomaly': 'Device Fingerprint Anomaly',
      'secret_access_anomaly': 'Secret Access Anomaly',
      'bulk_secret_access': 'Bulk Secret Access',
      'secret_rotation_failure': 'Secret Rotation Failure',
      'unauthorized_secret_access': 'Unauthorized Secret Access',
      'agent_behavior_anomaly': 'Agent Behavior Anomaly',
      'unusual_agent_activity': 'Unusual Agent Activity',
      'agent_tool_misuse': 'Agent Tool Misuse',
      'configuration_change': 'Unauthorized Configuration Change',
      'backup_tampering': 'Backup Tampering Detected',
      'audit_log_tampering_attempt': 'Audit Log Tampering Attempt',
      'system_integrity_violation': 'System Integrity Violation'
    };
    
    return titles[eventType] || 'Security Event Detected';
  }
  
  /**
   * Generates a description for the event
   */
  private static generateDescription(eventType: SecurityEventType, details?: Record<string, any>): string {
    return `Security event of type '${eventType}' detected${details ? ` with details: ${JSON.stringify(details)}` : ''}`;
  }
  
  /**
   * Calculates risk score for an event
   */
  private static calculateRiskScore(eventType: SecurityEventType, severity: ThreatSeverity): number {
    const severityScores: Record<ThreatSeverity, number> = {
      'info': 10,
      'low': 25,
      'medium': 50,
      'high': 75,
      'critical': 95
    };
    
    const eventTypeMultipliers: Partial<Record<SecurityEventType, number>> = {
      'brute_force_attempt': 1.2,
      'data_exfiltration_attempt': 1.5,
      'privilege_escalation_attempt': 1.3,
      'known_malicious_ip': 1.4
    };
    
    const baseScore = severityScores[severity];
    const multiplier = eventTypeMultipliers[eventType] || 1.0;
    
    return Math.min(100, Math.round(baseScore * multiplier));
  }
  
  /**
   * Assesses potential impact of an event
   */
  private static assessImpact(eventType: SecurityEventType): string {
    const impacts: Partial<Record<SecurityEventType, string>> = {
      'brute_force_attempt': 'Potential account compromise',
      'data_exfiltration_attempt': 'Data breach and regulatory penalties',
      'privilege_escalation_attempt': 'Unauthorized system access',
      'known_malicious_ip': 'Active attack in progress'
    };
    
    return impacts[eventType] || 'Security incident requiring investigation';
  }
  
  /**
   * Recommends action for an event
   */
  private static recommendAction(eventType: SecurityEventType): string {
    const actions: Partial<Record<SecurityEventType, string>> = {
      'brute_force_attempt': 'Block IP address and notify user',
      'data_exfiltration_attempt': 'Isolate affected systems and investigate',
      'privilege_escalation_attempt': 'Revoke elevated privileges immediately',
      'known_malicious_ip': 'Block IP at firewall and review logs'
    };
    
    return actions[eventType] || 'Investigate and assess impact';
  }
  
  /**
   * Gets recent security events for a tenant
   */
  static async getRecentEvents(tenantId: string, limit: number = 100): Promise<SecurityEvent[]> {
    const { data } = await supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('detected_at', { ascending: false })
      .limit(limit);
    
    return (data || []).map(this.mapToEvent);
  }
  
  /**
   * Maps database row to SecurityEvent
   */
  private static mapToEvent(row: any): SecurityEvent {
    return {
      ...row,
      detectedAt: new Date(row.detected_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      mitigatedAt: row.mitigated_at ? new Date(row.mitigated_at) : undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined
    };
  }
}