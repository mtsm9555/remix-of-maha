import type {
  ScalingDirection,
  ScalingEvent,
  ScalingMetric,
  ScalingPolicy,
  ScalingTrigger,
} from "./AutoScalingTypes";
import { MetricsCollector } from "./MetricsCollector.server";
import { CloudProviderScaler } from "./CloudProviderScaler.server";

interface Decision {
  shouldScale: boolean;
  direction: ScalingDirection;
  trigger: ScalingTrigger;
  reason: string;
  metricValue: number;
  thresholdValue: number;
}

function rowToPolicy(r: any): ScalingPolicy {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    targetResourceType: r.target_resource_type,
    targetResourceId: r.target_resource_id,
    minInstances: r.min_instances,
    maxInstances: r.max_instances,
    currentInstances: r.current_instances,
    desiredInstances: r.desired_instances,
    triggers: r.triggers ?? [],
    triggerConfigs: r.trigger_configs ?? {},
    scaleUpCooldownSeconds: r.scale_up_cooldown_seconds,
    scaleDownCooldownSeconds: r.scale_down_cooldown_seconds,
    stabilizationWindowSeconds: r.stabilization_window_seconds,
    status: r.status,
    cloudProvider: r.cloud_provider,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    lastScaledAt: r.last_scaled_at ? new Date(r.last_scaled_at) : undefined,
  };
}

export class ScalingEngine {
  static async getActivePolicies(): Promise<ScalingPolicy[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("scaling_policies")
      .select("*")
      .eq("status", "active");
    return (data ?? []).map(rowToPolicy);
  }

  static async getPolicy(id: string): Promise<ScalingPolicy | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("scaling_policies").select("*").eq("id", id).maybeSingle();
    return data ? rowToPolicy(data) : null;
  }

  static async evaluatePolicy(policy: ScalingPolicy): Promise<ScalingEvent | null> {
    if (policy.status !== "active") return null;
    const metrics = await MetricsCollector.collectMetrics(policy);
    const decision = this.decide(policy, metrics);
    if (!decision.shouldScale) return null;

    // Cooldown check via last event
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cooldown =
      decision.direction === "scale_up" ? policy.scaleUpCooldownSeconds : policy.scaleDownCooldownSeconds;
    const { data: last } = await supabaseAdmin
      .from("scaling_events")
      .select("initiated_at,direction")
      .eq("policy_id", policy.id)
      .eq("direction", decision.direction)
      .order("initiated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last && Date.now() - new Date(last.initiated_at).getTime() < cooldown * 1000) return null;

    const step = Math.max(1, Math.ceil(policy.currentInstances * 0.25));
    const desired =
      decision.direction === "scale_up"
        ? Math.min(policy.maxInstances, policy.currentInstances + step)
        : Math.max(policy.minInstances, policy.currentInstances - step);
    if (desired === policy.currentInstances) return null;

    const event: ScalingEvent = {
      id: `event_${crypto.randomUUID()}`,
      policyId: policy.id,
      direction: decision.direction,
      trigger: decision.trigger,
      instancesBefore: policy.currentInstances,
      instancesAfter: desired,
      reason: decision.reason,
      metricValue: decision.metricValue,
      thresholdValue: decision.thresholdValue,
      status: "in_progress",
      initiatedAt: new Date(),
    };

    await supabaseAdmin.from("scaling_events").insert({
      id: event.id,
      policy_id: event.policyId,
      direction: event.direction,
      trigger: event.trigger,
      instances_before: event.instancesBefore,
      instances_after: event.instancesAfter,
      reason: event.reason,
      metric_value: event.metricValue,
      threshold_value: event.thresholdValue,
      status: event.status,
      initiated_at: event.initiatedAt.toISOString(),
    });

    try {
      await CloudProviderScaler.scale(policy, desired);
      await supabaseAdmin
        .from("scaling_events")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", event.id);
      await supabaseAdmin
        .from("scaling_policies")
        .update({
          current_instances: desired,
          desired_instances: desired,
          last_scaled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", policy.id);
      event.status = "completed";
      event.completedAt = new Date();
    } catch (err: any) {
      await supabaseAdmin
        .from("scaling_events")
        .update({ status: "failed", error: err?.message ?? String(err), completed_at: new Date().toISOString() })
        .eq("id", event.id);
      event.status = "failed";
      event.error = err?.message ?? String(err);
    }

    return event;
  }

  private static decide(policy: ScalingPolicy, m: ScalingMetric): Decision {
    const cfg = policy.triggerConfigs;
    for (const trig of policy.triggers) {
      const t = cfg[trig];
      if (!t) continue;
      if (trig === "cpu" && t.cpuThresholdPercent != null) {
        if (m.cpuUsagePercent > t.cpuThresholdPercent)
          return { shouldScale: true, direction: "scale_up", trigger: trig, reason: "CPU high", metricValue: m.cpuUsagePercent, thresholdValue: t.cpuThresholdPercent };
        if (m.cpuUsagePercent < t.cpuThresholdPercent * 0.5)
          return { shouldScale: true, direction: "scale_down", trigger: trig, reason: "CPU low", metricValue: m.cpuUsagePercent, thresholdValue: t.cpuThresholdPercent };
      }
      if (trig === "memory" && t.memoryThresholdPercent != null) {
        if (m.memoryUsagePercent > t.memoryThresholdPercent)
          return { shouldScale: true, direction: "scale_up", trigger: trig, reason: "Memory high", metricValue: m.memoryUsagePercent, thresholdValue: t.memoryThresholdPercent };
      }
      if (trig === "queue_depth" && t.queueDepthThreshold != null) {
        if (m.queueDepth > t.queueDepthThreshold)
          return { shouldScale: true, direction: "scale_up", trigger: trig, reason: "Queue backlog", metricValue: m.queueDepth, thresholdValue: t.queueDepthThreshold };
      }
    }
    return { shouldScale: false, direction: "no_change", trigger: "cpu", reason: "", metricValue: 0, thresholdValue: 0 };
  }
}