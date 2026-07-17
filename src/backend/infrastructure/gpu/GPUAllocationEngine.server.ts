import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type {
  AllocationStrategy,
  GPUAllocation,
  GPUAllocationRequest,
  GPUHardware,
} from './GPUSchedulerTypes';
import { GPU_HOURLY_PRICE_USD } from './GPUSchedulerTypes';
import { GPUNodeManager } from './GPUNodeManager.server';

function selectGPUs(gpus: GPUHardware[], count: number, strategy: AllocationStrategy): GPUHardware[] {
  const sorted = [...gpus];
  switch (strategy) {
    case 'best_fit':
      sorted.sort((a, b) => a.vramGB - b.vramGB);
      break;
    case 'pack':
      sorted.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
      break;
    case 'spread':
      sorted.sort((a, b) => a.nodeId.localeCompare(b.nodeId)); // caller can further diversify
      break;
    case 'first_fit':
    default:
      break;
  }
  return sorted.slice(0, count);
}

function costPerHour(gpus: GPUHardware[]): number {
  return gpus.reduce((sum, g) => sum + (GPU_HOURLY_PRICE_USD[g.model] ?? 1.0), 0);
}

async function findSuitable(req: GPUAllocationRequest): Promise<GPUHardware[]> {
  const available = await GPUNodeManager.getAvailableGPUs();
  return available.filter((g) => {
    if (g.vramGB < req.requiredVRAMGB) return false;
    if (req.preferredGPUModel && g.model !== req.preferredGPUModel) return false;
    if (req.requiresMIG && !g.supportsMIG) return false;
    if (req.minCudaComputeCapability && g.cudaComputeCapability < req.minCudaComputeCapability) return false;
    return true;
  });
}

export const GPUAllocationEngine = {
  async allocateGPUs(
    request: GPUAllocationRequest,
    strategy: AllocationStrategy = 'best_fit',
  ): Promise<GPUAllocation | null> {
    const suitable = await findSuitable(request);
    if (suitable.length < request.requiredGPUs) return null;

    const selected = selectGPUs(suitable, request.requiredGPUs, strategy);
    if (selected.length < request.requiredGPUs) return null;

    const allocation: GPUAllocation = {
      id: `alloc_${crypto.randomUUID()}`,
      requestId: request.id,
      taskId: request.taskId,
      tenantId: request.tenantId,
      gpuIds: selected.map((g) => g.id),
      totalVRAMGB: selected.reduce((s, g) => s + g.vramGB, 0),
      allocatedAt: new Date(),
      estimatedCompletionAt: new Date(Date.now() + request.estimatedDurationMinutes * 60_000),
      status: 'active',
      costPerHourUSD: costPerHour(selected),
      metadata: request.metadata,
    };

    for (const g of selected) {
      await GPUNodeManager.updateGPUState(g.id, 'allocated', allocation.id, request.taskId);
    }

    const { error } = await supabaseAdmin.from('gpu_allocations').insert({
      id: allocation.id,
      request_id: allocation.requestId,
      task_id: allocation.taskId,
      tenant_id: allocation.tenantId,
      gpu_ids: allocation.gpuIds,
      total_vram_gb: allocation.totalVRAMGB,
      allocated_at: allocation.allocatedAt.toISOString(),
      estimated_completion_at: allocation.estimatedCompletionAt?.toISOString(),
      status: allocation.status,
      cost_per_hour_usd: allocation.costPerHourUSD,
      metadata: allocation.metadata as never,
    });
    if (error) throw error;
    return allocation;
  },

  async releaseAllocation(allocationId: string, status: 'completed' | 'failed' | 'cancelled' = 'completed'): Promise<void> {
    const { data: alloc, error } = await supabaseAdmin
      .from('gpu_allocations')
      .select('*')
      .eq('id', allocationId)
      .maybeSingle();
    if (error) throw error;
    if (!alloc) return;

    const gpuIds = (alloc.gpu_ids as string[]) ?? [];
    for (const gid of gpuIds) {
      await GPUNodeManager.updateGPUState(gid, 'available', null, null);
    }

    const completedAt = new Date();
    const durationHours =
      (completedAt.getTime() - new Date(alloc.allocated_at).getTime()) / 3_600_000;
    const totalCost = durationHours * (alloc.cost_per_hour_usd ?? 0);

    await supabaseAdmin
      .from('gpu_allocations')
      .update({
        status,
        actual_completion_at: completedAt.toISOString(),
        total_cost_usd: totalCost,
      })
      .eq('id', allocationId);

    for (const gid of gpuIds) {
      await supabaseAdmin.from('gpu_cost_records').insert({
        id: `cost_${crypto.randomUUID()}`,
        allocation_id: allocationId,
        gpu_id: gid,
        tenant_id: alloc.tenant_id,
        duration_hours: durationHours,
        utilization_percent: alloc.average_utilization ?? 0,
        cost_per_hour_usd: (alloc.cost_per_hour_usd ?? 0) / Math.max(gpuIds.length, 1),
        total_cost_usd: totalCost / Math.max(gpuIds.length, 1),
        instance_type: 'on_demand',
      });
    }
  },
};