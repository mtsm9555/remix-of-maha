import type { AutomationTask } from "../types";

export class PermissionManager {
  private restricted = ["payment", "purchase", "delete", "email_send"];

  async validate(task: AutomationTask) {
    if (this.restricted.includes(task.action)) {
      return { allowed: false, requiresApproval: true };
    }
    return { allowed: true, requiresApproval: false };
  }
}