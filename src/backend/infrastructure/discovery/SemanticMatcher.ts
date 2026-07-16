import type { AgentProfile, TaskRoutingRequest } from "./DiscoveryTypes";

export class SemanticMatcher {
  static calculateSimilarity(taskEmbedding: number[], agentEmbedding: number[]): number {
    if (taskEmbedding.length === 0 || agentEmbedding.length === 0) return 0.5;
    if (taskEmbedding.length !== agentEmbedding.length) return 0.5;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < taskEmbedding.length; i++) {
      dot += taskEmbedding[i] * agentEmbedding[i];
      magA += taskEmbedding[i] * taskEmbedding[i];
      magB += agentEmbedding[i] * agentEmbedding[i];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  static filterByHardRequirements(
    agents: AgentProfile[],
    request: TaskRoutingRequest,
  ): AgentProfile[] {
    return agents.filter((agent) => {
      if (request.requiredDepartment && agent.department !== request.requiredDepartment) return false;
      if (request.minTrustScore && agent.trustScore < request.minTrustScore) return false;
      if (request.maxBudgetUSD && agent.costPerTaskUSD > request.maxBudgetUSD) return false;
      if (request.requiredTools && request.requiredTools.length > 0) {
        const hasAll = request.requiredTools.every((t) => agent.supportedTools.includes(t));
        if (!hasAll) return false;
      }
      return true;
    });
  }
}