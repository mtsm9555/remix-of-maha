// src/backend/cicd/CICDPlatformTypes.ts

export type PipelineStatus = 'idle' | 'running' | 'success' | 'failed' | 'cancelled' | 'paused';
export type JobStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';
export type DeploymentStrategy = 'rolling' | 'blue_green' | 'canary' | 'recreate';
export type EnvironmentType = 'development' | 'staging' | 'production' | 'custom';
export type TriggerType = 'push' | 'pull_request' | 'tag' | 'schedule' | 'manual' | 'webhook';

export interface Pipeline {
  id: string;
  tenantId: string;
  
  // Basic Info
  name: string;
  description?: string;
  repositoryUrl: string;
  branch: string;
  
  // Configuration
  definition: PipelineDefinition;
  variables: Record<string, string>;
  secrets: string[]; // Secret IDs
  
  // Triggers
  triggers: PipelineTrigger[];
  
  // Settings
  timeoutMinutes: number;
  concurrencyLimit: number;
  autoCancelOnNewPush: boolean;
  
  // Metadata
  createdBy: string;
  lastRunAt?: Date;
  lastRunStatus?: PipelineStatus;
  runCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineDefinition {
  version: string;
  stages: PipelineStage[];
  artifacts?: ArtifactConfig[];
  notifications?: NotificationConfig[];
}

export interface PipelineStage {
  name: string;
  jobs: JobDefinition[];
  condition?: string; // Expression to evaluate
  parallel?: boolean;
  allowFailure?: boolean;
}

export interface JobDefinition {
  name: string;
  image?: string;
  commands: string[];
  environment?: Record<string, string>;
  artifacts?: {
    paths: string[];
    expireIn?: string;
  };
  cache?: {
    key: string;
    paths: string[];
  };
  dependencies?: string[]; // Job names
  timeout?: number; // seconds
  retry?: number;
  when?: 'always' | 'on_success' | 'on_failure';
}

export interface PipelineTrigger {
  type: TriggerType;
  
  // Push/PR triggers
  branches?: string[];
  tags?: string[];
  paths?: string[];
  
  // Schedule trigger
  cron?: string;
  timezone?: string;
  
  // Manual trigger
  requireApproval?: boolean;
  approvers?: string[];
  
  isActive: boolean;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  tenantId: string;
  
  // Trigger Info
  triggeredBy: string;
  triggerType: TriggerType;
  commitHash?: string;
  commitMessage?: string;
  branch?: string;
  tag?: string;
  
  // Status
  status: PipelineStatus;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds: number;
  
  // Stages
  stages: StageRun[];
  
  // Artifacts
  artifacts: Artifact[];
  
  // Metadata
  environment?: string;
  variables: Record<string, string>;
  
  createdAt: Date;
}

export interface StageRun {
  id: string;
  runId: string;
  name: string;
  
  status: JobStatus;
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds: number;
  
  jobs: JobRun[];
}

export interface JobRun {
  id: string;
  stageId: string;
  name: string;
  
  // Execution
  image: string;
  commands: string[];
  
  // Status
  status: JobStatus;
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds: number;
  
  // Output
  logs: string[];
  exitCode?: number;
  
  // Artifacts
  artifacts: string[]; // Artifact paths
  
  // Retry
  retryCount: number;
  maxRetries: number;
}

export interface Artifact {
  id: string;
  runId: string;
  tenantId: string;
  
  name: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  
  // Storage
  storageUrl: string;
  checksum: string;
  
  // Lifecycle
  expiresAt?: Date;
  downloadedAt?: Date;
  downloadedBy?: string;
  
  createdAt: Date;
}

export interface Environment {
  id: string;
  tenantId: string;
  
  name: string;
  type: EnvironmentType;
  description?: string;
  
  // Configuration
  url?: string;
  variables: Record<string, string>;
  secrets: string[];
  
  // Deployment
  deploymentStrategy: DeploymentStrategy;
  autoDeployOnSuccess: boolean;
  requireApproval: boolean;
  approvers?: string[];
  
  // Protection
  isProtected: boolean;
  allowedBranches?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Deployment {
  id: string;
  environmentId: string;
  runId: string;
  tenantId: string;
  
  // Deployment Info
  version: string;
  commitHash?: string;
  
  // Strategy
  strategy: DeploymentStrategy;
  
  // Status
  status: 'pending' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  startedAt: Date;
  completedAt?: Date;
  durationSeconds: number;
  
  // Details
  deployedBy: string;
  approvedBy?: string;
  
  // Rollback
  previousDeploymentId?: string;
  rollbackReason?: string;
  
  // Health
  healthCheckPassed: boolean;
  healthCheckUrl?: string;
  
  createdAt: Date;
}

export interface WebhookConfig {
  id: string;
  tenantId: string;
  
  provider: 'github' | 'gitlab' | 'bitbucket' | 'custom';
  repositoryUrl: string;
  secret: string;
  
  // Events
  events: string[];
  
  // Settings
  isActive: boolean;
  lastTriggeredAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CICDMetrics {
  tenantId: string;
  period: string;
  
  // Pipeline Metrics
  totalPipelines: number;
  successfulPipelines: number;
  failedPipelines: number;
  successRate: number;
  
  // Time Metrics
  averageBuildTime: number; // seconds
  averageDeploymentTime: number;
  meanTimeToRecovery: number;
  
  // Deployment Metrics
  totalDeployments: number;
  successfulDeployments: number;
  deploymentFrequency: number; // per day
  
  // Job Metrics
  totalJobs: number;
  averageJobDuration: number;
  
  // Trend
  buildTimeTrend: 'improving' | 'stable' | 'degrading';
  successRateTrend: 'improving' | 'stable' | 'degrading';
}