import { generateEmbedding } from "./EmbeddingClient.server";
import { ProjectMemoryStore } from "./ProjectMemoryStore.server";

export interface ProjectContextChunk {
  id: string;
  source: "project";
  content: string;
  relevanceScore: number;
  tokenEstimate: number;
  metadata?: Record<string, unknown>;
}

export class ProjectContextBuilder {
  /** Builds a highly relevant context payload specific to the current project. */
  static async buildProjectContext(
    projectId: string,
    taskDescription: string,
    _maxTokens: number = 2000,
  ): Promise<{ contextText: string; chunks: ProjectContextChunk[] }> {
    const projectContext = await ProjectMemoryStore.getProjectContext(projectId);
    if (!projectContext) return { contextText: "", chunks: [] };

    const queryEmbedding = await generateEmbedding(taskDescription);
    const relevantMemories = await ProjectMemoryStore.searchMemories({
      projectId,
      queryText: taskDescription,
      queryEmbedding,
      limit: 5,
      minConfidence: 0.75,
    });

    const chunks: ProjectContextChunk[] = [];
    let contextText = `<PROJECT_CONTEXT>\n`;
    contextText += `Project: ${projectContext.projectName} (Client: ${projectContext.clientName})\n`;
    contextText += `Phase: ${projectContext.activePhase}\n`;
    contextText += `Summary: ${projectContext.summary ?? ""}\n`;
    contextText += `</PROJECT_CONTEXT>\n\n`;

    chunks.push({
      id: "proj_summary",
      source: "project",
      content: contextText,
      relevanceScore: 1.0,
      tokenEstimate: Math.ceil(contextText.length / 4),
    });

    if (relevantMemories.length > 0) {
      contextText += `<RELEVANT_PROJECT_MEMORY>\n`;
      for (const mem of relevantMemories) {
        const memBlock = `- [${mem.type.toUpperCase()}] ${mem.content}\n`;
        contextText += memBlock;
        chunks.push({
          id: mem.id,
          source: "project",
          content: memBlock,
          relevanceScore: mem.similarity,
          tokenEstimate: Math.ceil(memBlock.length / 4),
          metadata: { type: mem.type },
        });
      }
      contextText += `</RELEVANT_PROJECT_MEMORY>`;
    }

    return { contextText, chunks };
  }
}