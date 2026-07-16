import type {
  RawReputationEventInput,
  ReputationEvent,
  ReputationEventType,
  ReputationMetrics,
  ReputationScore,
  TrustLevel,
} from "./ReputationTypes";
import type { Department } from "../../agents/departments/types";
import { ReputationCalculator } from "./ReputationCalculator";
import { ReputationGuard } from "./ReputationGuard";

const IMPACTS: Record<ReputationEventType, number> = {
  TASK_SUCCESS: 0.02,
  TASK_FAILURE: -0.05,
  QA_REJECTED: -0.08,
  HUMAN_OVERRIDE: -0.15,
  BUDGET_OVERUN: -0.1,
  SLA_MISS: -0.05,
};

const DEFAULT_METRICS: ReputationMetrics = {
  successRate: 0.5,
  averageQAScore: 0.5,
  humanOverrideRate: 0.0,
  budgetAdherence: 1.0,
  slaCompliance: 1.0,
  selfCorrectionRate: 0.5,
};

export class ReputationEventProcessor {
  static async processEvent(raw: RawReputationEventInput): Promise<ReputationScore> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const repEvent: ReputationEvent = {
      id: `rep_${crypto.randomUUID()}`,
      agentId: raw.agentId,
      eventType: raw.type,
      severity: raw.severity,
      scoreImpact: IMPACTS[raw.type] ?? 0,
      metadata: raw.metadata ?? {},
      timestamp: new Date(),
    };

    const { data: metricsRow } = await supabaseAdmin
      .from("agent_reputation_metrics")
      .select("*")
      .eq("agent_id", raw.agentId)
      .maybeSingle();

    const currentMetrics: ReputationMetrics = metricsRow
      ? {
          successRate: metricsRow.success_rate,
          averageQAScore: metricsRow.average_qa_score,
          humanOverrideRate: metricsRow.human_override_rate,
          budgetAdherence: metricsRow.budget_adherence,
          slaCompliance: metricsRow.sla_compliance,
          selfCorrectionRate: metricsRow.self_correction_rate,
        }
      : DEFAULT_METRICS;

    const { data: scoreRow } = await supabaseAdmin
      .from("agent_reputation_scores")
      .select("*")
      .eq("agent_id", raw.agentId)
      .maybeSingle();

    const totalTasks = scoreRow?.total_tasks_evaluated ?? 0;
    const previousTrust = (scoreRow?.trust_level ?? undefined) as TrustLevel | undefined;
    const department: Department =
      raw.department ?? ((scoreRow?.department as Department | undefined) ?? "development");

    const { newMetrics, newScore } = ReputationCalculator.calculateNewScore(
      currentMetrics,
      repEvent,
      totalTasks,
      department,
    );

    await supabaseAdmin.from("agent_reputation_metrics").upsert(
      {
        agent_id: raw.agentId,
        success_rate: newMetrics.successRate,
        average_qa_score: newMetrics.averageQAScore,
        human_override_rate: newMetrics.humanOverrideRate,
        budget_adherence: newMetrics.budgetAdherence,
        sla_compliance: newMetrics.slaCompliance,
        self_correction_rate: newMetrics.selfCorrectionRate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agent_id" },
    );

    await supabaseAdmin.from("agent_reputation_scores").upsert(
      {
        agent_id: raw.agentId,
        department: newScore.department,
        composite_score: newScore.compositeScore,
        trust_level: newScore.trustLevel,
        trend: newScore.trend,
        total_tasks_evaluated: newScore.totalTasksEvaluated,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agent_id" },
    );

    await supabaseAdmin.from("reputation_events").insert({
      id: repEvent.id,
      agent_id: repEvent.agentId,
      event_type: repEvent.eventType,
      severity: repEvent.severity,
      score_impact: repEvent.scoreImpact,
      metadata: repEvent.metadata as never,
      created_at: repEvent.timestamp.toISOString(),
    });

    await ReputationGuard.evaluateAndEnforce(newScore, previousTrust);

    return newScore;
  }
}