import { globalEventBus } from "../EventBus";
import { AgentChannel, EventType, type AgentEvent } from "../types";

export class PlannerAgent {
  constructor() {
    globalEventBus.subscribe(
      AgentChannel.SYSTEM,
      EventType.USER_INPUT_RECEIVED,
      this.handleUserInput.bind(this),
    );
  }

  private async handleUserInput(event: AgentEvent) {
    const userQuery = event.payload.query;

    const toolEvent: AgentEvent = {
      id: crypto.randomUUID(),
      type: EventType.TOOL_REQUESTED,
      channel: AgentChannel.EXECUTION,
      payload: { toolName: "search_web", args: { query: userQuery } },
      timestamp: new Date(),
      correlationId: event.correlationId,
      sourceAgent: "Planner",
    };

    await globalEventBus.publish(toolEvent);
  }
}