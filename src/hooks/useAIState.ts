import { useMemo } from "react";
import { determineState, type AIState, type StateContext } from "@/services/stateMachine";

export function useAIState(ctx: StateContext): AIState {
  return useMemo(() => determineState(ctx), [
    ctx.isSpeaking,
    ctx.waitingResponse,
    ctx.receivingAudio,
    ctx.analyzingImage,
    ctx.searchingMemory,
    ctx.executingTask,
    ctx.hasError,
  ]);
}