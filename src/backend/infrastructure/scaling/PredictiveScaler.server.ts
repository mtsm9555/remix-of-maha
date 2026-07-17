import type { ScalingPolicy, ScalingPrediction } from "./AutoScalingTypes";
import { MetricsCollector } from "./MetricsCollector.server";

export class PredictiveScaler {
  static async generatePredictions(policy: ScalingPolicy): Promise<ScalingPrediction[]> {
    const cfg = policy.triggerConfigs.predictive;
    const windowMin = cfg?.predictionWindowMinutes ?? 60;
    const confThreshold = cfg?.predictionConfidenceThreshold ?? 0.7;

    const history = await MetricsCollector.getHistoricalMetrics(policy.id, 168);
    if (history.length < 24) return [];

    // Simple linear regression on cpu vs time
    const t0 = history[0].timestamp.getTime();
    const xs = history.map((h) => (h.timestamp.getTime() - t0) / 60_000);
    const ys = history.map((h) => h.cpuUsagePercent);
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumXX = xs.reduce((a, x) => a + x * x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return [];
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const futureX = xs[xs.length - 1] + windowMin;
    const predictedCpu = Math.max(0, Math.min(100, slope * futureX + intercept));
    const meanY = sumY / n;
    const ssTot = ys.reduce((a, y) => a + (y - meanY) ** 2, 0);
    const ssRes = ys.reduce((a, y, i) => a + (y - (slope * xs[i] + intercept)) ** 2, 0);
    const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

    if (r2 < confThreshold) return [];

    const cpuTarget = policy.triggerConfigs.cpu?.cpuThresholdPercent ?? 70;
    const predictedInstances = Math.max(
      policy.minInstances,
      Math.min(policy.maxInstances, Math.ceil((predictedCpu / cpuTarget) * policy.currentInstances)),
    );

    const prediction: ScalingPrediction = {
      id: `pred_${crypto.randomUUID()}`,
      policyId: policy.id,
      predictedTimestamp: new Date(Date.now() + windowMin * 60_000),
      predictedMetricValue: predictedCpu,
      predictedInstancesNeeded: predictedInstances,
      confidenceScore: r2,
      generatedAt: new Date(),
    };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("scaling_predictions").insert({
      id: prediction.id,
      policy_id: prediction.policyId,
      predicted_timestamp: prediction.predictedTimestamp.toISOString(),
      predicted_metric_value: prediction.predictedMetricValue,
      predicted_instances_needed: prediction.predictedInstancesNeeded,
      confidence_score: prediction.confidenceScore,
      generated_at: prediction.generatedAt.toISOString(),
    });

    return [prediction];
  }
}