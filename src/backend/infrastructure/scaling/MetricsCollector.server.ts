import type { ScalingMetric, ScalingPolicy } from "./AutoScalingTypes";

export class MetricsCollector {
  static async collectMetrics(policy: ScalingPolicy): Promise<ScalingMetric> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const sinceIso = new Date(Date.now() - 60_000).toISOString();
    const { data: workers } = await supabaseAdmin
      .from("worker_nodes")
      .select("cpu_usage,memory_usage")
      .gte("last_heartbeat_at", sinceIso);

    const rows = (workers ?? []) as Array<{ cpu_usage?: number | null; memory_usage?: number | null }>;
    const avg = (key: "cpu_usage" | "memory_usage") =>
      rows.length === 0 ? 0 : (rows.reduce((s, w) => s + (w[key] ?? 0), 0) / rows.length) * 100;

    const { count: queueDepth } = await supabaseAdmin
      .from("cluster_tasks")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending");

    const metric: ScalingMetric = {
      id: `metric_${crypto.randomUUID()}`,
      policyId: policy.id,
      timestamp: new Date(),
      cpuUsagePercent: avg("cpu_usage"),
      memoryUsagePercent: avg("memory_usage"),
      queueDepth: queueDepth ?? 0,
      requestsPerSecond: 0,
      customMetrics: {},
      currentInstances: policy.currentInstances,
      desiredInstances: policy.desiredInstances,
    };

    await supabaseAdmin.from("scaling_metrics").insert({
      id: metric.id,
      policy_id: metric.policyId,
      timestamp: metric.timestamp.toISOString(),
      cpu_usage_percent: metric.cpuUsagePercent,
      memory_usage_percent: metric.memoryUsagePercent,
      queue_depth: metric.queueDepth,
      requests_per_second: metric.requestsPerSecond,
      custom_metrics: metric.customMetrics,
      current_instances: metric.currentInstances,
      desired_instances: metric.desiredInstances,
    });

    return metric;
  }

  static async getHistoricalMetrics(policyId: string, hours: number): Promise<ScalingMetric[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sinceIso = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data } = await supabaseAdmin
      .from("scaling_metrics")
      .select("*")
      .eq("policy_id", policyId)
      .gte("timestamp", sinceIso)
      .order("timestamp", { ascending: true });
    return (data ?? []).map((r: any) => ({
      id: r.id,
      policyId: r.policy_id,
      timestamp: new Date(r.timestamp),
      cpuUsagePercent: r.cpu_usage_percent,
      memoryUsagePercent: r.memory_usage_percent,
      queueDepth: r.queue_depth,
      requestsPerSecond: r.requests_per_second,
      customMetrics: r.custom_metrics ?? {},
      currentInstances: r.current_instances,
      desiredInstances: r.desired_instances,
    }));
  }
}