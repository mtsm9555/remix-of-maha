import { generateEmbedding } from "../project/EmbeddingClient.server";
import { SharedMemoryStore } from "./SharedMemoryStore.server";
import type { AccessLevel, SharedContextChunk } from "./SharedMemoryTypes";

export class GlobalContextBuilder {
  /**
   * Builds an organization-wide context block for an agent, filtered by clearance.
   */
  static async buildGlobalContext(
    taskDescription: string,
    agentClearance: AccessLevel = "internal",
    limit = 3,
  ): Promise<{ contextText: string; chunks: SharedContextChunk[] }> {
    const embedding = await generateEmbedding(taskDescription);
    const memories = await SharedMemoryStore.searchGlobalMemories(
      embedding,
      agentClearance,
      limit,
    );
    if (memories.length === 0) return { contextText: "", chunks: [] };

    const chunks: SharedContextChunk[] = [];
    let contextText = "<GLOBAL_ORGANIZATIONAL_KNOWLEDGE>\n";
    for (const m of memories) {
      const tag = `[${m.category.toUpperCase()} - ${m.accessLevel.toUpperCase()}]`;
      const block = `- ${tag} ${m.content}\n`;
      contextText += block;
      chunks.push({
        id: m.id,
        source: "shared_memory",
        content: block,
        relevanceScore: m.similarity,
        tokenEstimate: Math.ceil(block.length / 4),
        metadata: { accessLevel: m.accessLevel, category: m.category },
      });
    }
    contextText += "</GLOBAL_ORGANIZATIONAL_KNOWLEDGE>";
    return { contextText, chunks };
  }
}