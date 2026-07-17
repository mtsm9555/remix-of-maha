// src/backend/security/compliance/ComplianceLayerTypes.ts

export type ComplianceFramework = 'GDPR' | 'CCPA' | 'SOC2' | 'ISO27001' | 'HIPAA' | 'PCI_DSS' | 'FedRAMP' | 'custom';
export type ControlStatus = 'compliant' | 'non_compliant' | 'partial' | 'not_applicable' | 'not_assessed';
export type EvidenceType = 'automated' | 'manual' | 'document' | 'screenshot' | 'log_export' | 'configuration';
export type CertificationStatus = 'certified' | 'pending' | 'expired' | 'revoked' | 'in_progress';
export type DataResidencyRequirement = 'eu_only' | 'us_only' | 'specific_countries' | 'no_restrictions';

export interface ComplianceControl {
  id: string;
  tenantId: string;
  
  // Control Definition
  framework: ComplianceFramework;
  controlId: string; // e.g., 'GDPR_Art32', 'SOC2_CC6.1'
  controlName: string;
  description: string;
  category: string; // e.g., 'access_control', 'encryption', 'audit_logging'
  
  // Requirements
  requirement: string;
  implementationGuidance: string;
  
  // Assessment
  status: ControlStatus;
  lastAssessedAt?: Date;
  assessedBy?: string;
  
  // Evidence
  evidenceCollected: number;
  lastEvidenceAt?: Date;
  
  // Automation
  autoMonitorable: boolean;
  monitoringQuery?: string; // SQL or API query to check compliance
  
  // Risk
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  gapSeverity?: 'minor' | 'major' | 'critical';
  remediationPlan?: string;
  
  // Metadata
  tags: string[];
  metadata: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceEvidence {
  id: string;
  tenantId: string;
  controlId: string;
  
  // Evidence Details
  type: EvidenceType;
  title: string;
  description: string;
  
  // Content
  content: string; // JSON, text, or reference to file
  fileUrl?: string;
  fileSizeBytes?: number;
  
  // Collection
  collectedAt: Date;
  collectedBy: string; // 'system' or user ID
  collectionMethod: 'automated' | 'manual' | 'api';
  
  // Validation
  isValid: boolean;
  validationNotes?: string;
  validatedAt?: Date;
  validatedBy?: string;
  
  // Expiration
  expiresAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface ComplianceReport {
  id: string;
  tenantId: string;
  
  // Report Details
  framework: ComplianceFramework;
  reportType: 'assessment' | 'gap_analysis' | 'audit_ready' | 'certification';
  title: string;
  description: string;
  
  // Period
  periodStart: Date;
  periodEnd: Date;
  
  // Results
  overallScore: number; // 0-100
  totalControls: number;
  compliantControls: number;
  nonCompliantControls: number;
  partialControls: number;
  notApplicableControls: number;
  
  // Gaps
  criticalGaps: number;
  majorGaps: number;
  minorGaps: number;
  
  // Evidence
  totalEvidence: number;
  automatedEvidence: number;
  manualEvidence: number;
  
  // Status
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'published';
  generatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  
  // Findings
  findings: ComplianceFinding[];
  recommendations: string[];
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceFinding {
  id: string;
  reportId: string;
  controlId: string;
  
  // Finding Details
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  
  // Evidence
  evidence: string;
  rootCause?: string;
  
  // Remediation
  remediationPlan: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  targetDate?: Date;
  
  // Status
  status: 'open' | 'in_progress' | 'resolved' | 'accepted' | 'waived';
  resolvedAt?: Date;
  resolvedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceCertification {
  id: string;
  tenantId: string;
  
  // Certification Details
  framework: ComplianceFramework;
  certificationName: string;
  certifyingBody: string; // e.g., 'BSI', 'TÜV', 'AICPA'
  
  // Status
  status: CertificationStatus;
  certificationNumber?: string;
  
  // Dates
  issuedAt?: Date;
  expiresAt?: Date;
  lastAuditAt?: Date;
  nextAuditAt?: Date;
  
  // Scope
  scope: string;
  locations: string[];
  
  // Evidence
  auditReportUrl?: string;
  certificateUrl?: string;
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataResidencyPolicy {
  id: string;
  tenantId: string;
  
  // Policy Details
  name: string;
  description: string;
  
  // Requirements
  requirement: DataResidencyRequirement;
  allowedCountries: string[]; // ISO 3166-1 alpha-2
  allowedRegions: string[]; // e.g., 'eu', 'us', 'apac'
  
  // Enforcement
  enforceOnCreate: boolean;
  enforceOnUpdate: boolean;
  blockNonCompliant: boolean;
  
  // Monitoring
  monitorContinuously: boolean;
  alertOnViolation: boolean;
  
  // Status
  isActive: boolean;
  violations: number;
  lastViolationAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecord {
  id: string;
  tenantId: string;
  userId: string;
  
  // Consent Details
  purpose: string; // e.g., 'marketing', 'analytics', 'data_sharing'
  granted: boolean;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  consentText?: string;
  
  // Timestamps
  grantedAt: Date;
  expiresAt?: Date;
  withdrawnAt?: Date;
  withdrawnBy?: string;
  
  // Proof
  proofUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceMetrics {
  tenantId: string;
  period: string;
  
  // Overall Compliance
  overallComplianceScore: number; // 0-100
  
  // By Framework
  byFramework: Record<ComplianceFramework, {
    score: number;
    totalControls: number;
    compliantControls: number;
    gaps: number;
  }>;
  
  // Evidence
  totalEvidence: number;
  automatedEvidencePercentage: number;
  expiringEvidence: number;
  
  // Certifications
  activeCertifications: number;
  expiringCertifications: number;
  
  // Data Residency
  residencyViolations: number;
  
  // Consent
  consentRecords: number;
  activeConsents: number;
  withdrawnConsents: number;
  
  // Trends
  complianceTrend: 'improving' | 'stable' | 'degrading';
  
  // Risk
  highRiskGaps: number;
  criticalGaps: number;
}

export interface ComplianceGap {
  id: string;
  tenantId: string;
  controlId: string;
  
  // Gap Details
  severity: 'minor' | 'major' | 'critical';
  title: string;
  description: string;
  
  // Impact
  potentialImpact: string;
  affectedDataCategories: string[];
  
  // Remediation
  remediationSteps: string[];
  estimatedEffortDays: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Status
  status: 'identified' | 'in_progress' | 'resolved' | 'accepted';
  identifiedAt: Date;
  resolvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}