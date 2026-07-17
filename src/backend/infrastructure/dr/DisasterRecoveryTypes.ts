export type RegionStatus = 'primary' | 'secondary' | 'dr_standby' | 'failed';
export type FailoverStatus = 'idle' | 'initiated' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
export type ReplicationStatusType = 'active' | 'lagging' | 'paused' | 'failed';
export type DRTestStatus = 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'cancelled';

export interface DRRegion {
  id: string;
  tenantId: string;
  regionName: string;
  status: RegionStatus;
  databaseEndpoint: string;
  cacheEndpoint: string;
  storageEndpoint: string;
  apiEndpoint: string;
  isHealthy: boolean;
  lastHealthCheckAt: Date;
  healthScore: number;
  replicationStatus: ReplicationStatusType;
  replicationLagSeconds: number;
  lastReplicatedAt: Date;
  cpuUtilization: number;
  memoryUtilization: number;
  storageUtilization: number;
  isPrimary: boolean;
  failoverPriority: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FailoverTrigger {
  id: string;
  type: 'health_check_failed' | 'replication_lag' | 'manual' | 'scheduled_test';
  condition: string;
  threshold?: number;
  durationSeconds?: number;
}

export interface FailoverStep {
  id: string;
  order: number;
  name: string;
  description: string;
  action: 'promote_replica' | 'update_dns' | 'switch_traffic' | 'notify_stakeholders' | 'verify_services' | 'rollback';
  config: Record<string, unknown>;
  timeoutSeconds: number;
  retryAttempts: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface FailoverPlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sourceRegionId: string;
  targetRegionId: string;
  failoverType: 'automatic' | 'manual';
  triggers: FailoverTrigger[];
  rtoSeconds: number;
  rpoSeconds: number;
  steps: FailoverStep[];
  isActive: boolean;
  lastTestedAt?: Date;
  lastFailoverAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FailoverEvent {
  id: string;
  tenantId: string;
  planId: string;
  triggerType: FailoverTrigger['type'];
  triggerReason: string;
  sourceRegionId: string;
  targetRegionId: string;
  status: FailoverStatus;
  currentStepId?: string;
  initiatedAt: Date;
  completedAt?: Date;
  actualRTOSeconds?: number;
  actualRPOSeconds?: number;
  stepsCompleted: number;
  stepsFailed: number;
  errorMessage?: string;
  rolledBack: boolean;
  rollbackAt?: Date;
  rollbackReason?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DRTestStepResult {
  stepId: string;
  stepName: string;
  status: 'passed' | 'failed' | 'skipped';
  durationSeconds: number;
  errorMessage?: string;
  details: Record<string, unknown>;
}

export interface DRTest {
  id: string;
  tenantId: string;
  planId: string;
  testName: string;
  testType: 'full_failover' | 'partial_failover' | 'replication_test' | 'restore_test';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: DRTestStatus;
  passedSteps: number;
  failedSteps: number;
  totalSteps: number;
  actualRTOSeconds?: number;
  actualRPOSeconds?: number;
  targetRTOSeconds: number;
  targetRPOSeconds: number;
  rtoMet: boolean;
  rpoMet: boolean;
  testResults: DRTestStepResult[];
  errorMessage?: string;
  recommendations: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}