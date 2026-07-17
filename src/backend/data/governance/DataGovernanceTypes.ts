export type PIICategory =
  | "ssn"
  | "credit_card"
  | "email"
  | "phone"
  | "address"
  | "passport"
  | "bank_account"
  | "ip_address"
  | "medical_record"
  | "biometric"
  | "custom";

export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "pii";

export type DataAction = "allow" | "redact" | "block" | "quarantine";

export interface PIIDetection {
  category: PIICategory;
  value: string;
  position: { start: number; end: number };
  confidence: number;
  redactedValue: string;
}

export interface PIIDetectionResult {
  found: boolean;
  detections: PIIDetection[];
  suggestedAction: DataAction;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string | null;
  applies_to: {
    dataTypes: string[];
    departments?: string[];
    classifications?: DataClassification[];
  };
  retention_days: number;
  action_after_retention: "archive" | "delete" | "anonymize";
  legal_hold_capable: boolean;
  is_active: boolean;
}

export interface DSARScope {
  dataTypes: string[];
  dateRange?: { start: string; end: string };
}

export interface DSARRequest {
  id: string;
  userId: string;
  requestType: "access" | "deletion" | "portability" | "correction";
  status: "pending" | "processing" | "completed" | "rejected";
  scope: DSARScope;
  requestedAt: Date;
  completedAt?: Date;
  processedBy: string;
  notes?: string;
}

export interface ComplianceAuditEvent {
  id: string;
  eventType:
    | "pii_detected"
    | "pii_redacted"
    | "data_deleted"
    | "dsar_processed"
    | "retention_enforced"
    | "classification_changed";
  entityId?: string;
  entityType?: string;
  userId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
  performedBy: string;
}