export type BackupType = 'full' | 'incremental' | 'differential';
export type BackupTarget = 'database' | 'files' | 'configurations' | 'complete';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'verified' | 'expired';
export type BackupStorage = 'local' | 's3' | 'gcs' | 'azure_blob' | 'cross_region';

export interface BackupJob {
  id: string;
  tenantId: string;
  type: BackupType;
  target: BackupTarget;
  storage: BackupStorage;
  includeTables?: string[];
  excludeTables?: string[];
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: BackupStatus;
  progress: number;
  errorMessage?: string;
  backupId: string;
  sizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number;
  fileCount: number;
  checksumSHA256: string;
  storagePath: string;
  storageRegion: string;
  encrypted: boolean;
  retentionDays: number;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupPolicy {
  id: string;
  tenantId: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  type: BackupType;
  target: BackupTarget;
  storage: BackupStorage;
  isActive: boolean;
  nextRunAt?: Date;
}

export interface RestoreJob {
  id: string;
  tenantId: string;
  backupId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'verified';
  progress: number;
}