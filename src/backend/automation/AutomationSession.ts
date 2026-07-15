import { AutomationRuntime } from "./AutomationRuntime";
import type { AutomationTask, AutomationResult } from "./types";

export class AutomationSession {
  private runtime = new AutomationRuntime();
  private history: Array<{ task: AutomationTask; result: AutomationResult }> = [];

  constructor(public sessionId: string) {}

  async run(task: AutomationTask) {
    const result = await this.runtime.execute(task);
    this.history.push({ task, result });
    return result;
  }

  getHistory() {
    return this.history;
  }
}