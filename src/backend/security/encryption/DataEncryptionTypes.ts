export type EncryptionAlgorithm = 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
export type KeyType = 'data_encryption' | 'key_encryption' | 'master_key';
export type EncryptionScope = 'field' | 'column' | 'table' | 'database';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'pii' | 'financial' | 'credentials';

export interface EncryptionKey {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: KeyType;
  algorithm: EncryptionAlgorithm;
  encryptedKeyMaterial: string;
  keyVersion: number;
  rotationEnabled: boolean;
  rotationIntervalDays?: number;
  lastRotatedAt?: Date;
  nextRotationAt?: Date;
  isActive: boolean;
  isRevoked: boolean;
  revokedAt?: Date;
  allowedServices: string[];
  allowedRoles: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface EncryptedField {
  tableName: string;
  fieldName: string;
  classification: DataClassification;
  encryptionKeyId: string;
  algorithm: EncryptionAlgorithm;
  description?: string;
  requiresAudit: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EncryptedValue {
  ciphertext: string;
  iv: string;
  authTag?: string;
  keyVersion: number;
  algorithm: EncryptionAlgorithm;
  encryptedAt: Date;
}

export interface EncryptionContext {
  tenantId: string;
  userId?: string;
  service: string;
  operation: 'encrypt' | 'decrypt';
  tableName?: string;
  fieldName?: string;
}

export interface EncryptionResult {
  encrypted: EncryptedValue;
  context: EncryptionContext;
}

export interface DecryptionResult {
  plaintext: string;
  context: EncryptionContext;
}

export interface KeyRotationEvent {
  id: string;
  keyId: string;
  tenantId: string;
  fromVersion: number;
  toVersion: number;
  rotatedBy: string;
  rotatedAt: Date;
  reason: 'scheduled' | 'manual' | 'compromised';
  metadata: Record<string, any>;
}

export interface EncryptionAuditLog {
  id: string;
  tenantId: string;
  action: 'encrypt' | 'decrypt' | 'key_created' | 'key_rotated' | 'key_revoked' | 'field_configured';
  actorId: string;
  actorType: 'user' | 'service' | 'system';
  keyId?: string;
  tableName?: string;
  fieldName?: string;
  recordCount?: number;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface EncryptionMetrics {
  tenantId: string;
  period: string;
  totalEncryptions: number;
  totalDecryptions: number;
  byTable: Record<string, { encryptions: number; decryptions: number }>;
  byField: Record<string, { encryptions: number; decryptions: number }>;
  activeKeys: number;
  rotatedKeys: number;
  expiringKeys: number;
  averageEncryptionTimeMs?: number;
  averageDecryptionTimeMs?: number;
}