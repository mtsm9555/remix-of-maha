import { ContextFetchers } from "./ContextFetchers";
import { ContextRanker } from "./ContextRanker";
import type { BuiltContext, ContextChunk } from "./types";

export class ContextBuilder {
  /**
   * Builds the final context payload for the LLM.
   */
  static async build(params: {
    userId: string;
    sessionId: string;
    currentQuery: string;
    toolResults?: string[];
    maxContextTokens?: number;
  }): Promise<BuiltContext> {
    const {
      userId,
      sessionId,
      currentQuery,
      toolResults = [],
      maxContextTokens = 2000,
    } = params;

    console.log(`[ContextBuilder] Building context for session: ${sessionId}`);

    const [conversationChunks, memoryChunks, graphChunks] = await Promise.all([
      ContextFetchers.getRecentConversation(sessionId, 5),
      ContextFetchers.getRelevantMemory(userId, currentQuery, 3),
      ContextFetchers.getGraphContext(currentQuery),
    ]);

    const toolChunks: ContextChunk[] = toolResults.map((result, index) => ({
      source: "tool_result" as const,
      content: `Tool Result ${index + 1}: ${result}`,
      relevanceScore: 0.95,
      metadata: {},
    }));

    const allChunks = [
      ...conversationChunks,
      ...memoryChunks,
      ...graphChunks,
      ...toolChunks,
    ];

    const rankedChunks = ContextRanker.rankAndTrim(allChunks, maxContextTokens);

    const aggregatedContext = rankedChunks
      .map(
        (chunk) =>
          `[${chunk.source.toUpperCase()}] (Relevance: ${chunk.relevanceScore.toFixed(2)}) ${chunk.content}`,
      )
      .join("\n\n");

    const tokenEstimate = Math.ceil(aggregatedContext.length / 4);

    return {
      userId,
      sessionId,
      currentQuery,
      aggregatedContext,
      chunks: rankedChunks,
      tokenEstimate,
    };
  }
}