// src/reasoning/reasoningMemory.ts

import { ReasoningOutput } from "./reasoningTypes";

export class ReasoningMemory {
  private history: ReasoningOutput[] = [];

  save(output: ReasoningOutput): void {
    this.history.push(output);
  }

  getAll(): ReasoningOutput[] {
    return [...this.history];
  }

  getByAgent(agentId: string): ReasoningOutput[] {
    return this.history.filter((item) => item.agentId === agentId);
  }

  getLatest(agentId: string): ReasoningOutput | undefined {
    const items = this.getByAgent(agentId);
    return items[items.length - 1];
  }
}
