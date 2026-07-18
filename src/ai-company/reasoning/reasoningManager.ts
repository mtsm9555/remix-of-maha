// src/reasoning/reasoningManager.ts

import { ReasoningEngine } from "./reasoningEngine";
import { ReasoningMemory } from "./reasoningMemory";
import { ReasoningInput, ReasoningOutput } from "./reasoningTypes";

export class ReasoningManager {
  constructor(
    private engine: ReasoningEngine,
    private memory: ReasoningMemory
  ) {}

  run(input: ReasoningInput): ReasoningOutput {
    const output = this.engine.think(input);
    this.memory.save(output);
    return output;
  }
}
