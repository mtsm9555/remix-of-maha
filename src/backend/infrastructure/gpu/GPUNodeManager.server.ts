import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { GPUHardware, GPUModel, GPUState } from './GPUSchedulerTypes';

function rowToGPU(r: any): GPUHardware {
  return {
    id: r.id,
    nodeId: r.node_id,
    vendor: r.vendor,
    model: r.model,
    vramGB: r.vram_gb,
    cudaCores: r.cuda_cores,
    tensorCores: r.tensor_cores,
    memoryBandwidthGBps: r.memory_bandwidth_gb_ps,
    tdpWatts: r.tdp_watts,
    supportsMIG: r.supports_mig,
    supportsFP8: r.supports_fp8,
    supportsBF16: r.supports_bf16,
    cudaComputeCapability: r.cuda_compute_capability,
    driverVersion: r.driver_version,
    cudaVersion: r.cuda_version,
    state: r.state,
    temperatureCelsius: r.temperature_celsius,
    powerUsageWatts: r.power_usage_watts,
    utilizationPercent: r.utilization_percent,
    memoryUsedGB: r.memory_used_gb,
    memoryFreeGB: r.memory_free_gb,
    currentAllocationId: r.current_allocation_id ?? undefined,
    allocatedToTaskId: r.allocated_to_task_id ?? undefined,
    migInstances: r.mig_instances ?? [],
    pciBusId: r.pci_bus_id,
    uuid: r.uuid,
    location: r.location,
    lastHealthCheckAt: new Date(r.last_health_check_at),
    errorCount: r.error_count,
    lastErrorAt: r.last_error_at ? new Date(r.last_error_at) : undefined,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export const GPUNodeManager = {
  async registerGPU(
    gpu: Omit<GPUHardware, 'id' | 'createdAt' | 'updatedAt' | 'state' | 'errorCount'>,
  ): Promise<GPUHardware> {
    const id = `gpu_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('gpu_hardware')
      .insert({
        id,
        node_id: gpu.nodeId,
        vendor: gpu.vendor,
        model: gpu.model,
        vram_gb: gpu.vramGB,
        cuda_cores: gpu.cudaCores,
        tensor_cores: gpu.tensorCores,
        memory_bandwidth_gb_ps: gpu.memoryBandwidthGBps,
        tdp_watts: gpu.tdpWatts,
        supports_mig: gpu.supportsMIG,
        supports_fp8: gpu.supportsFP8,
        supports_bf16: gpu.supportsBF16,
        cuda_compute_capability: gpu.cudaComputeCapability,
        driver_version: gpu.driverVersion,
        cuda_version: gpu.cudaVersion,
        state: 'available',
        temperature_celsius: gpu.temperatureCelsius,
        power_usage_watts: gpu.powerUsageWatts,
        utilization_percent: gpu.utilizationPercent,
        memory_used_gb: gpu.memoryUsedGB,
        memory_free_gb: gpu.memoryFreeGB,
        mig_instances: (gpu.migInstances ?? []) as unknown as never,
        pci_bus_id: gpu.pciBusId,
        uuid: gpu.uuid,
        location: gpu.location,
        last_health_check_at: now,
        error_count: 0,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToGPU(data);
  },

  async listGPUs(filter?: { state?: GPUState; model?: GPUModel; nodeId?: string }): Promise<GPUHardware[]> {
    let q = supabaseAdmin.from('gpu_hardware').select('*');
    if (filter?.state) q = q.eq('state', filter.state);
    if (filter?.model) q = q.eq('model', filter.model);
    if (filter?.nodeId) q = q.eq('node_id', filter.nodeId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(rowToGPU);
  },

  async getAvailableGPUs(): Promise<GPUHardware[]> {
    const { data, error } = await supabaseAdmin
      .from('gpu_hardware')
      .select('*')
      .eq('state', 'available')
      .lt('error_count', 5);
    if (error) throw error;
    return (data ?? []).map(rowToGPU);
  },

  async getGPU(id: string): Promise<GPUHardware | null> {
    const { data, error } = await supabaseAdmin.from('gpu_hardware').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToGPU(data) : null;
  },

  async updateGPUState(
    id: string,
    state: GPUState,
    allocationId?: string | null,
    taskId?: string | null,
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('gpu_hardware')
      .update({
        state,
        current_allocation_id: allocationId ?? null,
        allocated_to_task_id: taskId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async recordError(id: string, message: string): Promise<void> {
    const gpu = await this.getGPU(id);
    if (!gpu) return;
    const { error } = await supabaseAdmin
      .from('gpu_hardware')
      .update({
        error_count: gpu.errorCount + 1,
        last_error_at: new Date().toISOString(),
        state: gpu.errorCount + 1 >= 5 ? 'failed' : gpu.state,
      })
      .eq('id', id);
    if (error) throw error;
    console.warn(`[GPUNodeManager] GPU ${id} error: ${message}`);
  },
};