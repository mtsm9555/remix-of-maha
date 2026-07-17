import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { GPUAllocationRequest, GPUQueueItem, TaskPriority } from './GPUSchedulerTypes';
import { PRIORITY_WEIGHTS } from './GPUSchedulerTypes';
import { GPUAllocationEngine } from './GPUAllocationEngine.server';

function scoreFor(priority: TaskPriority, queuedAt: Date): number {
  const ageMinutes = (Date.now() - queuedAt.getTime()) / 60_000;
  return PRIORITY_WEIGHTS[priority] + Math.min(ageMinutes * 0.5, 100);
}

export const GPUQueueManager = {
  async enqueueRequest(request: GPUAllocationRequest): Promise<GPUQueueItem> {
    const queuedAt = new Date();
    const item: GPUQueueItem = {
      id: `queue_${crypto.randomUUID()}`,
      requestId: request.id,
      priority: request.priority,
      score: scoreFor(request.priority, queuedAt),
      queuedAt,
      estimatedWaitTimeMinutes: 0,
      requiredVRAMGB: request.requiredVRAMGB,
      requiredGPUs: request.requiredGPUs,
      status: 'queued',
    };

    await supabaseAdmin.from('gpu_allocation_requests').insert({
      id: request.id,
      task_id: request.taskId,
      tenant_id: request.tenantId,
      workspace_id: request.workspaceId ?? null,
      required_vram_gb: request.requiredVRAMGB,
      required_gpus: request.requiredGPUs,
      preferred_gpu_model: request.preferredGPUModel ?? null,
      min_cuda_compute_capability: request.minCudaComputeCapability ?? null,
      max_cost_per_hour_usd: request.maxCostPerHourUSD ?? null,
      max_latency_ms: request.maxLatencyMs ?? null,
      requires_mig: request.requiresMIG ?? false,
      requires_multi_gpu: request.requiresMultiGPU ?? false,
      task_type: request.taskType,
      estimated_duration_minutes: request.estimatedDurationMinutes,
      priority: request.priority,
      model_name: request.modelName ?? null,
      model_size_gb: request.modelSizeGB ?? null,
      metadata: request.metadata as never,
    });

    await supabaseAdmin.from('gpu_queue').insert({
      id: item.id,
      request_id: item.requestId,
      priority: item.priority,
      score: item.score,
      queued_at: item.queuedAt.toISOString(),
      estimated_wait_time_minutes: item.estimatedWaitTimeMinutes,
      required_vram_gb: item.requiredVRAMGB,
      required_gpus: item.requiredGPUs,
      status: item.status,
    });
    return item;
  },

  async processQueue(maxItems = 20): Promise<{ processed: number; allocated: number }> {
    const { data: items, error } = await supabaseAdmin
      .from('gpu_queue')
      .select('*')
      .eq('status', 'queued')
      .order('score', { ascending: false })
      .limit(maxItems);
    if (error) throw error;

    let allocated = 0;
    for (const item of items ?? []) {
      const { data: req } = await supabaseAdmin
        .from('gpu_allocation_requests')
        .select('*')
        .eq('id', item.request_id)
        .maybeSingle();
      if (!req) continue;

      const request: GPUAllocationRequest = {
        id: req.id,
        taskId: req.task_id,
        tenantId: req.tenant_id,
        workspaceId: req.workspace_id ?? undefined,
        requiredVRAMGB: req.required_vram_gb,
        requiredGPUs: req.required_gpus,
        preferredGPUModel: (req.preferred_gpu_model as never) ?? undefined,
        minCudaComputeCapability: req.min_cuda_compute_capability ?? undefined,
        maxCostPerHourUSD: req.max_cost_per_hour_usd ?? undefined,
        maxLatencyMs: req.max_latency_ms ?? undefined,
        requiresMIG: req.requires_mig,
        requiresMultiGPU: req.requires_multi_gpu,
        taskType: req.task_type as never,
        estimatedDurationMinutes: req.estimated_duration_minutes,
        priority: req.priority as TaskPriority,
        modelName: req.model_name ?? undefined,
        modelSizeGB: req.model_size_gb ?? undefined,
        metadata: (req.metadata as Record<string, unknown>) ?? {},
        createdAt: new Date(req.created_at),
      };

      const alloc = await GPUAllocationEngine.allocateGPUs(request);
      if (alloc) {
        await supabaseAdmin.from('gpu_queue').update({ status: 'scheduled' }).eq('id', item.id);
        allocated += 1;
      }
    }
    return { processed: items?.length ?? 0, allocated };
  },

  async cancelQueueItem(id: string): Promise<void> {
    await supabaseAdmin.from('gpu_queue').update({ status: 'cancelled' }).eq('id', id);
  },
};