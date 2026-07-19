export type AIState =
  | "booting"
  | "idle"
  | "listening"
  | "thinking"
  | "reasoning"
  | "speaking"
  | "vision"
  | "memory"
  | "executing"
  | "error";

export interface StateContext {
  isSpeaking: boolean;
  waitingResponse: boolean;
  receivingAudio: boolean;
  analyzingImage: boolean;
  searchingMemory: boolean;
  executingTask: boolean;
  hasError?: boolean;
}

export function determineState(ctx: StateContext): AIState {
  if (ctx.hasError) return "error";
  if (ctx.executingTask) return "executing";
  if (ctx.analyzingImage) return "vision";
  if (ctx.searchingMemory) return "memory";
  if (ctx.receivingAudio) return "speaking";
  if (ctx.waitingResponse) return "reasoning";
  if (ctx.isSpeaking) return "listening";
  return "idle";
}