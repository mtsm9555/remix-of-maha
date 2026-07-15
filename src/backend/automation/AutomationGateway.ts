import { AutomationRuntime } from "./AutomationRuntime";
import type { AutomationTask, AutomationResult } from "./types";

// Framework-agnostic gateway (no express in the Worker runtime).
export class AutomationGateway {
  private runtime = new AutomationRuntime();

  async handle(task: AutomationTask): Promise<AutomationResult> {
    return this.runtime.execute(task);
  }
}