import { AgentRegistryStore } from "../registry/AgentRegistryStore";
import { SemanticMatcher } from "./SemanticMatcher";
import { ReputationScorer } from "./ReputationScorer";
import type {
  AgentProfile,
  DiscoveryResult,
  TaskRoutingRequest,
} from "./DiscoveryTypes";
import type { AgentMetadata } from "../registry/AgentRegistryTypes";

export class AdvancedDiscoveryService {
  static async discoverOptimalAgent(request: TaskRoutingRequest): Promise<DiscoveryResult | null> {
    const allAgents = await AgentRegistryStore.searchAgents({});
    const healthy = allAgents.filter((a) => a.status === "healthy" || a.status === "degraded");
    const profiles = await Promise.all(healthy.map((a) => this.toProfile(a)));

    const candidates = SemanticMatcher.filterByHardRequirements(profiles, request);
    if (candidates.length === 0) return null;

    const enriched = await Promise.all(
      candidates.map((a) => ReputationScorer.enrichProfileWithReputation(a)),
    );

    const scored = enriched.map((agent) => ({
      agent,
      score: this.calculateRoutingScore(agent, request),
      reasoning: this.generateReasoning(agent, request),
    }));
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    return {
      selectedAgent: best.agent,
      routingScore: best.score,
      reasoning: best.reasoning,
      estimatedLatencyMs: this.estimateLatency(best.agent),
      estimatedCostUSD: best.agent.costPerTaskUSD,
    };
  }

  private static async toProfile(agent: AgentMetadata): Promise<AgentProfile> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("agent_capability_embeddings")
      .select("supported_tools, capability_embedding, cost_per_task_usd")
      .eq("agent_type", agent.agentType)
      .maybeSingle();

    const rawEmbedding = data?.capability_embedding;
    const embedding: number[] = Array.isArray(rawEmbedding)
      ? rawEmbedding
      : typeof rawEmbedding === "string"
        ? this.parseVector(rawEmbedding)
        : [];

    return {
      instanceId: agent.instanceId,
      agentType: agent.agentType,
      department: agent.department,
      capabilityEmbedding: embedding,
      supportedTools: data?.supported_tools ?? agent.capabilities.tools,
      trustScore: 0.5,
      totalTasksCompleted: 0,
      humanOverrideRate: 0,
      currentLoad: agent.currentLoad,
      status: agent.status === "offline" ? "unreachable" : agent.status,
      costPerTaskUSD: data?.cost_per_task_usd ?? 0.01,
      endpoint: `${agent.network.protocol}://${agent.network.host}:${agent.network.port}${agent.network.executionEndpoint}`,
    };
  }

  private static parseVector(v: string): number[] {
    try {
      return JSON.parse(v);
    } catch {
      return [];
    }
  }

  private static calculateRoutingScore(agent: AgentProfile, request: TaskRoutingRequest): number {
    const semanticScore = SemanticMatcher.calculateSimilarity(
      request.taskEmbedding,
      agent.capabilityEmbedding,
    );
    const loadScore = 1.0 - agent.currentLoad;
    const costEfficiency = 1.0 - agent.costPerTaskUSD / 10.0;

    switch (request.strategy) {
      case "highest_trust":
        return agent.trustScore * 0.7 + semanticScore * 0.2 + loadScore * 0.1;
      case "cheapest":
        return costEfficiency * 0.6 + semanticScore * 0.2 + agent.trustScore * 0.2;
      case "fastest":
        return loadScore * 0.6 + semanticScore * 0.2 + agent.trustScore * 0.2;
      case "optimal":
      default:
        return (
          semanticScore * 0.4 + agent.trustScore * 0.3 + loadScore * 0.2 + costEfficiency * 0.1
        );
    }
  }

  private static generateReasoning(agent: AgentProfile, request: TaskRoutingRequest): string {
    return `Selected via '${request.strategy}' strategy. Trust: ${(agent.trustScore * 100).toFixed(0)}%, Load: ${(agent.currentLoad * 100).toFixed(0)}%, Cost: $${agent.costPerTaskUSD.toFixed(2)}`;
  }

  private static estimateLatency(agent: AgentProfile): number {
    return 150 + agent.currentLoad * 500;
  }
}