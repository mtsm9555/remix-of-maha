// src/backend/security/threat/ThreatDetectionTypes.ts

export type IOCType = 'ip' | 'domain' | 'url' | 'hash_md5' | 'hash_sha256' | 'email' | 'user_agent' | 'wallet_address';
export type ThreatCategory = 'malware' | 'phishing' | 'botnet' | 'ransomware' | 'apt' | 'cryptomining' | 'ddos' | 'data_exfiltration' | 'insider_threat' | 'zero_day';
export type MITRETactic = 'reconnaissance' | 'resource_development' | 'initial_access' | 'execution' | 'persistence' | 'privilege_escalation' | 'defense_evasion' | 'credential_access' | 'discovery' | 'lateral_movement' | 'collection' | 'command_and_control' | 'exfiltration' | 'impact';
export type KillChainPhase = 'reconnaissance' | 'weaponization' | 'delivery' | 'exploitation' | 'installation' | 'command_and_control' | 'actions_on_objectives';
export type BehavioralMetric = 'login_frequency' | 'data_access_volume' | 'api_call_rate' | 'file_download_count' | 'session_duration' | 'geographic_pattern' | 'time_of_day_pattern' | 'tool_usage_pattern';

export interface IndicatorOfCompromise {
  id: string;
  tenantId: string;
  
  // IOC Details
  type: IOCType;
  value: string;
  
  // Classification
  category: ThreatCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0.0 to 1.0
  
  // MITRE ATT&CK Mapping
  mitreTactics: MITRETactic[];
  mitreTechniques: string[]; // e.g., T1078 (Valid Accounts)
  killChainPhase?: KillChainPhase;
  
  // Source
  source: 'internal' | 'threat_feed' | 'community' | 'manual' | 'ml_detected';
  sourceFeed?: string; // e.g., 'AbuseIPDB', 'VirusTotal', 'AlienVault'
  sourceUrl?: string;
  
  // Metadata
  description?: string;
  tags: string[];
  firstSeenAt: Date;
  lastSeenAt: Date;
  expirationAt?: Date;
  
  // Status
  isActive: boolean;
  hitCount: number;
  lastHitAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatFeed {
  id: string;
  tenantId: string;
  
  name: string;
  description?: string;
  feedType: 'stix' | 'taxii' | 'csv' | 'json' | 'api';
  feedUrl: string;
  apiKey?: string;
  
  // Configuration
  refreshIntervalMinutes: number;
  iocTypes: IOCType[];
  minConfidence: number;
  autoImport: boolean;
  
  // Status
  isActive: boolean;
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'failed' | 'partial';
  totalIOCs: number;
  newIOCsLastSync: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BehavioralBaseline {
  id: string;
  tenantId: string;
  entityId: string; // User ID, Agent ID, or API Key ID
  entityType: 'user' | 'agent' | 'api_key' | 'service_account';
  
  // Baseline Metrics
  metrics: Record<BehavioralMetric, {
    mean: number;
    standardDeviation: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
    samples: number;
  }>;
  
  // Temporal Patterns
  hourlyPatterns: number[]; // 24 hours of activity distribution
  dayOfWeekPatterns: number[]; // 7 days of activity distribution
  commonLocations: string[]; // Countries/cities
  commonIPs: string[];
  commonUserAgents: string[];
  
  // Metadata
  baselinePeriod: { start: Date; end: Date };
  confidence: number;
  sampleSize: number;
  
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface BehavioralAnomaly {
  id: string;
  tenantId: string;
  baselineId: string;
  entityId: string;
  entityType: string;
  
  // Anomaly Details
  metric: BehavioralMetric;
  currentValue: number;
  baselineValue: number;
  deviationScore: number; // Z-score or similar
  
  // Classification
  severity: 'low' | 'medium' | 'high' | 'critical';
  anomalyType: 'spike' | 'drop' | 'pattern_break' | 'location_anomaly' | 'temporal_anomaly';
  
  // Context
  context: Record<string, any>;
  contributingFactors: string[];
  
  // Risk
  riskScore: number; // 0-100
  potentialThreat: string;
  
  detectedAt: Date;
  createdAt: Date;
}

export interface AttackChain {
  id: string;
  tenantId: string;
  
  // Chain Details
  name: string;
  description: string;
  
  // MITRE ATT&CK
  tactics: MITRETactic[];
  techniques: string[];
  killChainPhases: KillChainPhase[];
  
  // Events
  relatedEventIds: string[];
  eventSequence: AttackChainEvent[];
  
  // Analysis
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  attackVector: string;
  targetResources: string[];
  
  // Status
  status: 'detected' | 'investigating' | 'confirmed' | 'mitigated';
  detectedAt: Date;
  completedAt?: Date;
  
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttackChainEvent {
  id: string;
  chainId: string;
  order: number;
  
  eventId: string;
  eventType: string;
  tactic: MITRETactic;
  technique?: string;
  
  timestamp: Date;
  actorId: string;
  targetId?: string;
  
  details: Record<string, any>;
}

export interface ThreatHuntQuery {
  id: string;
  tenantId: string;
  
  // Query Details
  name: string;
  description: string;
  hypothesis: string;
  
  // Query Definition
  queryType: 'ioc_search' | 'behavioral_anomaly' | 'attack_pattern' | 'custom';
  query: Record<string, any>;
  
  // Execution
  status: 'draft' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  
  // Results
  totalMatches: number;
  highConfidenceMatches: number;
  findings: ThreatHuntFinding[];
  
  // Metadata
  createdBy: string;
  scheduledRecurrence?: string; // Cron expression
  lastRunAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatHuntFinding {
  id: string;
  huntId: string;
  
  // Finding Details
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  
  // Evidence
  relatedEventIds: string[];
  evidence: Record<string, any>;
  
  // Classification
  isTruePositive: boolean;
  classification?: 'true_positive' | 'false_positive' | 'benign_positive';
  classifiedBy?: string;
  classifiedAt?: Date;
  
  createdAt: Date;
}

export interface ThreatScore {
  entityId: string;
  entityType: 'user' | 'agent' | 'ip' | 'domain' | 'api_key';
  tenantId: string;
  
  // Scores
  overallRiskScore: number; // 0-100
  behavioralRiskScore: number;
  reputationRiskScore: number;
  iocHitScore: number;
  
  // Factors
  contributingFactors: {
    factor: string;
    weight: number;
    score: number;
  }[];
  
  // Trend
  trend: 'improving' | 'stable' | 'degrading';
  trendChange: number; // Percentage change from last period
  
  calculatedAt: Date;
  expiresAt: Date;
}