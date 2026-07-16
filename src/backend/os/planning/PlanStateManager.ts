// Minimal in-memory plan state manager used by the prioritization engine.

export interface PlanState {
  planId: string;
  events: { timestamp: Date; message: string }[];
  completedTaskIds: Set<string>;
}

const states = new Map<string, PlanState>();

export class PlanStateManager {
  static getState(planId: string): PlanState | undefined {
    return states.get(planId);
  }

  static ensureState(planId: string): PlanState {
    let s = states.get(planId);
    if (!s) {
      s = { planId, events: [], completedTaskIds: new Set() };
      states.set(planId, s);
    }
    return s;
  }

  static logEvent(planId: string, message: string): void {
    const s = this.ensureState(planId);
    s.events.push({ timestamp: new Date(), message });
    console.log(`[Plan ${planId}] ${message}`);
  }

  static markCompleted(planId: string, taskId: string): void {
    this.ensureState(planId).completedTaskIds.add(taskId);
  }
}
