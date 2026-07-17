export type GPUVendor = 'nvidia' | 'amd' | 'intel';
export type GPUModel = 'H100' | 'A100' | 'A6000' | 'V100' | 'T4' | 'RTX4090' | 'RTX3090' | 'custom';
export type GPUState = 'available' | 'allocated' | 'reserved' | 'maintenance' | 'failed';
export type AllocationStrategy = 'best_fit' | 'first_fit' | 'spread' | 'pack';
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export interface MIGInstance {
  id: string;
  gpuId: string;
  instanceId: number;
  vramGB: number;
  computeUnits: number;
  state: GPUState;
  allocatedToTaskId?: string;
}

export interface GPUHardware {
  id: string;
  nodeId: string;
  vendor: GPUVendor;
  model: GPUModel;
  vramGB: number;
  cudaCores: number;
  tensorCores: number;
  memoryBandwidthGBps: number;
  tdpWatts: number;
  supportsMIG: boolean;
  supportsFP8: boolean;
  supportsBF16: boolean;
  cudaComputeCapability: string;
  driverVersion: string;
  cudaVersion: string;
  state: GPUState;
  temperatureCelsius: number;
  powerUsageWatts: number;
  utilizationPercent: number;
  memoryUsedGB: number;
  memoryFreeGB: number;
  currentAllocationId?: string;
  allocatedToTaskId?: string;
  migInstances?: MIGInstance[];
  pciBusId: string;
  uuid: string;
  location: string;
  lastHealthCheckAt: Date;
  errorCount: number;
  lastErrorAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GPUAllocationRequest {
  id: string;
  taskId: string;
  tenantId: string;
  workspaceId?: string;
  requiredVRAMGB: number;
  requiredGPUs: number;
  preferredGPUModel?: GPUModel;
  minCudaComputeCapability?: string;
  maxCostPerHourUSD?: number;
  maxLatencyMs?: number;
  requiresMIG?: boolean;
  requiresMultiGPU?: boolean;
  taskType: 'inference' | 'training' | 'fine_tuning' | 'embedding' | 'custom';
  estimatedDurationMinutes: number;
  priority: TaskPriority;
  modelName?: string;
  modelSizeGB?: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface GPUAllocation {
  id: string;
  requestId: string;
  taskId: string;
  tenantId: string;
  gpuIds: string[];
  migInstanceIds?: string[];
  totalVRAMGB: number;
  allocatedAt: Date;
  estimatedCompletionAt?: Date;
  actualCompletionAt?: Date;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  costPerHourUSD: number;
  totalCostUSD?: number;
  averageUtilization?: number;
  averageTemperature?: number;
  metadata: Record<string, unknown>;
}

export interface GPUQueueItem {
  id: string;
  requestId: string;
  priority: TaskPriority;
  score: number;
  queuedAt: Date;
  estimatedWaitTimeMinutes: number;
  requiredVRAMGB: number;
  requiredGPUs: number;
  status: 'queued' | 'scheduled' | 'cancelled';
}

export interface GPUHealthMetrics {
  gpuId: string;
  timestamp: Date;
  temperatureCelsius: number;
  powerUsageWatts: number;
  utilizationPercent: number;
  memoryUsedGB: number;
  memoryFreeGB: number;
  clockSpeedMHz: number;
  fanSpeedPercent: number;
  eccErrors: number;
  xidErrors: number;
  thermalThrottling: boolean;
  powerThrottling: boolean;
  healthScore: number;
  alerts: string[];
}

export const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 100,
  high: 50,
  normal: 10,
  low: 5,
  background: 1,
};

export const GPU_HOURLY_PRICE_USD: Record<GPUModel, number> = {
  H100: 4.5,
  A100: 3.0,
  A6000: 1.8,
  V100: 1.5,
  T4: 0.6,
  RTX4090: 1.2,
  RTX3090: 0.9,
  custom: 1.0,
};