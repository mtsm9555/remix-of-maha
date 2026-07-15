import type { AgentResult } from "./types";

export class ResultAggregator {
  aggregate(results: AgentResult[]) {
    return {
      timestamp: new Date(),
      success: results.every((r) => r.success),
      results,
    };
  }
}