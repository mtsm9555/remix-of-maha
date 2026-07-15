import { globalEventBus } from "../EventBus";
import { AgentChannel, EventType, type AgentEvent } from "../types";
import { globalToolRouter } from "../../tools/ToolRouter";

export class ExecutionAgent {
  constructor() {
    globalEventBus.subscribe(
      AgentChannel.EXECUTION,
      EventType.TOOL_REQUESTED,
      this.handleToolRequest.bind(this),
    );
  }

  private async handleToolRequest(event: AgentEvent) {
    const { toolName, args } = event.payload;

    const result = await globalToolRouter.route(toolName, args, {
      userId: event.payload.userId,
      sessionId: event.correlationId,
      agentName: "Execution",
    });

    await globalEventBus.publish({
      id: crypto.randomUUID(),
      type: EventType.TOOL_EXECUTED,
      channel: AgentChannel.SYSTEM,
      payload: { result, originalRequest: event.payload },
      timestamp: new Date(),
      correlationId: event.correlationId,
      sourceAgent: "Execution",
    });
  }
}