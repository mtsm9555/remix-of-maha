import type { AgentStatus } from "../types";

export class LifecycleManager {
  private state: AgentStatus = "idle";

  getState(): AgentStatus {
    return this.state;
  }

  setState(next: AgentStatus) {
    this.state = next;
  }
}