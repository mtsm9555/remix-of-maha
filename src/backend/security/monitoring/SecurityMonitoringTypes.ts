// src/backend/security/monitoring/SecurityMonitoringTypes.ts

export type SecurityEventType =
  // Authentication Threats
  | 'brute_force_attempt'
  | 'credential_stuffing'
  | 'impossible_travel'
  | 'suspicious_login_location'
  | 'failed_mfa_attempts'
  | 'account_lockout'
  
  // Authorization Threats
  | 'privilege_escalation_attempt'
  | 'unauthorized_access_attempt'
  | 'role_violation'
  | 'permission_denied_spike'
  | 'suspicious_role_assignment'
  
  // Data Threats
  | 'data_exfiltration_attempt'
  | 'unusual_data_access'
  | 'bulk_data_download'
  | 'sensitive_data_access'
  | 'encryption_key_misuse'
  
  // API Threats
  | 'api_abuse'
  | 'rate_limit_violation'
  | 'injection_attempt'
  | 'unusual_api_pattern'
  | 'endpoint_scanning'
  
  // Infrastructure Threats
  | 'suspicious_ip_activity'
  | 'tor_exit_node_access'
  | 'known_malicious_ip'
  | 'geo_anomaly'
  | 'device_fingerprint_anomaly'
  
  // Secrets & Vault Threats
  | 'secret_access_anomaly'
  | 'bulk_secret_access'
  | 'secret_rotation_failure'
  | 'unauthorized_secret_access'
  
  // Agent Threats
  | 'agent_behavior_anomaly'
  | 'unusual_agent_activity'
  | 'agent_tool_misuse'
  
  // System Threats
  | 'configuration_change'
  | 'backup_tampering'
  | 'audit_log_tampering_attempt'
  | 'system_integrity_violation';

export type ThreatSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type ThreatStatus = 'detected' | 'investigating' | 'confirmed' | 'mitigated' | 'resolved' | 'false_positive';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';

export interface SecurityEvent {
  id: string;
  tenantId: string;
  workspaceId?: string;
  
  // Event Details
  eventType: SecurityEventType;
  severity: ThreatSeverity;
  title: string;
  description: string;
  
  // Actor (who triggered the event)
  actorId: string;
  actorType: 'user' | 'agent' | 'api_key' | 'system' | 'unknown';
  actorEmail?: string;
  actorName?: string;
  
  // Context
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  correlationId?: string;
  
  // Geolocation
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  
  // Detection
  detectionMethod: 'rule' | 'anomaly' | 'ml_model' | 'manual';
  confidenceScore: number; // 0.0 to 1.0
  ruleId?: string;
  
  // Related Events
  relatedEventIds: string[];
  eventCount: number; // Number of similar events in time window
  
  // Risk Assessment
  riskScore: number; // 0-100
  potentialImpact: string;
  recommendedAction: string;
  
  // Metadata
  details: Record<string, any>;
  metadata: Record<string, any>;
  
  // Status
  status: ThreatStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  mitigatedAt?: Date;
  mitigatedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Timestamps
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  tenantId: string;
  
  // Rule Definition
  name: string;
  description: string;
  eventType: SecurityEventType;
  severity: ThreatSeverity;
  
  // Conditions
  conditions: SecurityRuleCondition[];
  logic: 'AND' | 'OR';
  
  // Time Window
  timeWindowMinutes: number;
  threshold: number; // Number of events to trigger
  
  // Actions
  autoAcknowledge: boolean;
  autoMitigate: boolean;
  mitigationAction?: string;
  notifyChannels: ('email' | 'slack' | 'pagerduty' | 'webhook')[];
  
  // Status
  isActive: boolean;
  priority: number; // Evaluation order
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SecurityRuleCondition {
  field: string; // e.g., 'actor_id', 'ip_address', 'event_type'
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'regex';
  value: any;
}

export interface SecurityIncident {
  id: string;
  tenantId: string;
  
  // Incident Details
  title: string;
  description: string;
  severity: ThreatSeverity;
  category: string; // e.g., 'authentication', 'data_breach', 'unauthorized_access'
  
  // Related Events
  relatedEventIds: string[];
  eventCount: number;
  
  // Assignment
  assignedTo?: string;
  assignedAt?: Date;
  
  // Status
  status: IncidentStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Timeline
  detectedAt: Date;
  acknowledgedAt?: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  
  // Response
  responseActions: IncidentResponseAction[];
  rootCause?: string;
  lessonsLearned?: string;
  
  // Impact
  affectedUsers?: number;
  affectedResources?: string[];
  dataCompromised?: boolean;
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentResponseAction {
  id: string;
  incidentId: string;
  
  action: string;
  performedBy: string;
  performedAt: Date;
  
  details: Record<string, any>;
  result?: 'success' | 'failed' | 'partial';
  notes?: string;
}

export interface SecurityMetrics {
  tenantId: string;
  period: string; // e.g., "2026-01-17" or "2026-W03"
  
  // Event Volume
  totalEvents: number;
  eventsBySeverity: Record<ThreatSeverity, number>;
  eventsByType: Record<SecurityEventType, number>;
  eventsByHour: number[]; // 24 hours
  
  // Threats
  activeThreats: number;
  newThreatsToday: number;
  mitigatedThreats: number;
  falsePositives: number;
  
  // Incidents
  openIncidents: number;
  newIncidentsToday: number;
  resolvedIncidents: number;
  averageResolutionTimeHours: number;
  
  // Detection Performance
  detectionAccuracy: number; // 0-100
  meanTimeToDetect: number; // seconds
  meanTimeToRespond: number; // seconds
  
  // Risk Score
  overallRiskScore: number; // 0-100
  riskTrend: 'improving' | 'stable' | 'degrading';
  
  // Compliance
  complianceScore: number; // 0-100
  policyViolations: number;
  
  // Top Threats
  topThreatTypes: { type: SecurityEventType; count: number }[];
  topThreatActors: { actorId: string; count: number }[];
  topThreatIPs: { ip: string; count: number }[];
}

export interface SecurityAlert {
  id: string;
  tenantId: string;
  
  // Alert Details
  title: string;
  description: string;
  severity: ThreatSeverity;
  category: string;
  
  // Trigger
  triggerEventId?: string;
  triggerRuleId?: string;
  relatedEventIds: string[];
  
  // Notification
  notificationChannels: string[];
  notifiedAt: Date;
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatIntelligence {
  id: string;
  
  // Threat Data
  type: 'ip' | 'domain' | 'hash' | 'user_agent' | 'behavior_pattern';
  value: string;
  
  // Classification
  threatType: string; // e.g., 'malware', 'botnet', 'phishing'
  severity: ThreatSeverity;
  confidence: number;
  
  // Source
  source: string; // e.g., 'internal', 'threat_feed', 'community'
  sourceUrl?: string;
  
  // Metadata
  description?: string;
  tags: string[];
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  
  // Status
  isActive: boolean;
  expiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}