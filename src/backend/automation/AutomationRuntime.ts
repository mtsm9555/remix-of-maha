import { PermissionManager } from "./permissions/PermissionManager";
import { PlaywrightWorker } from "./workers/PlaywrightWorker";
import { AutomationLogger } from "./monitoring/AutomationLogger";
import type { AutomationTask, AutomationResult } from "./types";

export class AutomationRuntime {
  private permissions = new PermissionManager();
  private worker = new PlaywrightWorker();
  private logger = new AutomationLogger();

  async execute(task: AutomationTask): Promise<AutomationResult> {
    const validation = await this.permissions.validate(task);
    if (!validation.allowed) {
      return { success: false, requiresApproval: true };
    }

    let result: AutomationResult;
    try {
      switch (task.action) {
        case "open_url":
          result = { success: true, data: await this.worker.openUrl(task.payload.url) };
          break;
        case "extract":
          result = { success: true, data: await this.worker.extractText(task.payload.url) };
          break;
        case "screenshot":
          result = { success: true, data: await this.worker.screenshot(task.payload.url) };
          break;
        case "click":
          await this.worker.click(task.payload.url, task.payload.selector);
          result = { success: true };
          break;
        case "fill":
          await this.worker.fill(task.payload.url, task.payload.selector, task.payload.value);
          result = { success: true };
          break;
        default:
          result = { success: false, error: "Unsupported action" };
      }
    } catch (err: any) {
      result = { success: false, error: err?.message ?? String(err) };
    }

    await this.logger.log(task, result);
    return result;
  }
}