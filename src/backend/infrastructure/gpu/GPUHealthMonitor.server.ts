import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { GPUHardware, GPUHealthMetrics } from './GPUSchedulerTypes';
import { GPUNodeManager } from './GPUNodeManager.server';

function computeHealth(gpu: GPUHardware, m: Omit<GPUHealthMetrics, 'healthScore' | 'alerts' | 'gpuId' | 'timestamp'>): { score: number; alerts: string[] } {
  const alerts: string[] = [];
  let score = 100;
  if (m.temperatureCelsius > 85) { alerts.push(`Critical temperature: ${m.temperatureCelsius}°C`); score -= 30; }
  else if (m.temperatureCelsius > 75) { alerts.push(`High temperature: ${m.temperatureCelsius}°C`); score -= 15; }
  const powerPct = gpu.tdpWatts > 0 ? (m.powerUsageWatts / gpu.tdpWatts) * 100 : 0;
  if (powerPct > 95) { alerts.push(`Power usage critical: ${powerPct.toFixed(1)}%`); score -= 20; }
  const memPct = gpu.vramGB > 0 ? ((gpu.vramGB - m.memoryFreeGB) / gpu.vramGB) * 100 : 0;
  if (memPct > 95) { alerts.push(`Memory usage critical: ${memPct.toFixed(1)}%`); score -= 15; }
  if (m.thermalThrottling) { alerts.push('Thermal throttling active'); score -= 25; }
  if (m.powerThrottling) { alerts.push('Power throttling active'); score -= 15; }
  if (m.eccErrors > 0) { alerts.push(`ECC errors detected: ${m.eccErrors}`); score -= 10; }
  if (m.xidErrors > 0) { alerts.push(`XID errors detected: ${m.xidErrors}`); score -= 20; }
  return { score: Math.max(score, 0), alerts };
}

export const GPUHealthMonitor = {
  async recordMetrics(
    gpuId: string,
    metrics: Omit<GPUHealthMetrics, 'healthScore' | 'alerts' | 'gpuId' | 'timestamp'>,
  ): Promise<GPUHealthMetrics> {
    const gpu = await GPUNodeManager.getGPU(gpuId);
    if (!gpu) throw new Error(`GPU not found: ${gpuId}`);
    const { score, alerts } = computeHealth(gpu, metrics);
    const timestamp = new Date();
    const full: GPUHealthMetrics = { ...metrics, gpuId, timestamp, healthScore: score, alerts };
    await supabaseAdmin.from('gpu_health_metrics').insert({
      gpu_id: gpuId,
      timestamp: timestamp.toISOString(),
      temperature_celsius: metrics.temperatureCelsius,
      power_usage_watts: metrics.powerUsageWatts,
      utilization_percent: metrics.utilizationPercent,
      memory_used_gb: metrics.memoryUsedGB,
      memory_free_gb: metrics.memoryFreeGB,
      clock_speed_mhz: metrics.clockSpeedMHz,
      fan_speed_percent: metrics.fanSpeedPercent,
      ecc_errors: metrics.eccErrors,
      xid_errors: metrics.xidErrors,
      thermal_throttling: metrics.thermalThrottling,
      power_throttling: metrics.powerThrottling,
      health_score: score,
      alerts: alerts as never,
    });
    await supabaseAdmin.from('gpu_hardware').update({
      temperature_celsius: metrics.temperatureCelsius,
      power_usage_watts: metrics.powerUsageWatts,
      utilization_percent: metrics.utilizationPercent,
      memory_used_gb: metrics.memoryUsedGB,
      memory_free_gb: metrics.memoryFreeGB,
      last_health_check_at: timestamp.toISOString(),
      state: score < 20 ? 'failed' : gpu.state,
    }).eq('id', gpuId);
    return full;
  },

  async getRecentMetrics(gpuId: string, limit = 50) {
    const { data, error } = await supabaseAdmin
      .from('gpu_health_metrics')
      .select('*')
      .eq('gpu_id', gpuId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};