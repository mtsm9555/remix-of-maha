import { generateEmbedding } from "../project/EmbeddingClient.server";
import { UserMemoryStore } from "./UserMemoryStore.server";

export interface UserContextChunk {
  id: string;
  source: "user";
  content: string;
  relevanceScore: number;
  tokenEstimate: number;
}

export class UserContextBuilder {
  /** Builds a personalized context payload for the agent. */
  static async buildUserContext(
    userId: string,
    taskDescription: string,
  ): Promise<{ contextText: string; chunks: UserContextChunk[] }> {
    const profile = await UserMemoryStore.getUserProfile(userId);
    if (!profile) return { contextText: "", chunks: [] };

    let contextText = `<USER_PROFILE>\n`;
    contextText += `Name: ${profile.name ?? "Unknown"}\n`;
    contextText += `Role/Category: ${profile.category}\n`;
    contextText += `Communication Style: ${profile.communicationStyle}\n`;
    contextText += `Preferred Language: ${profile.preferredLanguage}\n`;
    contextText += `Timezone: ${profile.timezone}\n`;
    contextText += `</USER_PROFILE>\n\n`;

    const chunks: UserContextChunk[] = [
      {
        id: "user_profile",
        source: "user",
        content: contextText,
        relevanceScore: 1.0,
        tokenEstimate: Math.ceil(contextText.length / 4),
      },
    ];

    const taskEmbedding = await generateEmbedding(taskDescription);
    const relevant = await UserMemoryStore.searchMemories({
      userId,
      currentTaskDescription: taskDescription,
      taskEmbedding,
      limit: 3,
    });

    if (relevant.length > 0) {
      contextText += `<RELEVANT_USER_PREFERENCES>\n`;
      for (const mem of relevant) {
        const tag =
          mem.metadata.source === "ai_inferred"
            ? `[Inferred: ${(mem.metadata.confidenceScore * 100).toFixed(0)}%]`
            : "[Explicit]";
        const block = `- ${tag} ${mem.content}\n`;
        contextText += block;
        chunks.push({
          id: mem.id,
          source: "user",
          content: block,
          relevanceScore: 0.95,
          tokenEstimate: Math.ceil(block.length / 4),
        });
      }
      contextText += `</RELEVANT_USER_PREFERENCES>`;
    }

    return { contextText, chunks };
  }
}