import { osGenerate } from "../../os/llm";
import type {
  AgentCapabilityMap,
  DomainExpertise,
  Modality,
  ToolCapability,
} from "./CapabilityTypes";
import type { Department } from "../../agents/departments/types";

export class CapabilityExtractor {
  static async extractCapabilities(
    agentId: string,
    agentType: string,
    department: Department,
    systemPrompt: string,
    assignedToolNames: string[],
  ): Promise<AgentCapabilityMap> {
    const tools: ToolCapability[] = assignedToolNames.map((name) => ({
      name,
      description: `Tool: ${name}`,
      parameterSchema: {},
      isDestructive: name.includes("delete") || name.includes("drop"),
      requiresApproval: name.includes("deploy") || name.includes("transfer"),
    }));

    const analysis = await this.analyzeSystemPrompt(systemPrompt);

    return {
      agentId,
      agentType,
      department,
      inputModalities: analysis.inputModalities,
      outputModalities: analysis.outputModalities,
      maxConcurrentTasks: 3,
      tools,
      primaryModel: {
        provider: "google",
        modelName: "google/gemini-3-flash-preview",
        contextWindowTokens: 128000,
        maxOutputTokens: 8192,
        supportsVision: true,
        costPerInputTokenUSD: 0.0000025,
        costPerOutputTokenUSD: 0.00001,
      },
      fallbackModels: [],
      expertise: analysis.expertise,
      capabilityEmbedding: [],
      version: "1.0.0",
      lastUpdated: new Date(),
    };
  }

  private static async analyzeSystemPrompt(systemPrompt: string): Promise<{
    inputModalities: Modality[];
    outputModalities: Modality[];
    expertise: DomainExpertise[];
  }> {
    const prompt = `Analyze the following AI Agent System Prompt and extract its core capabilities.

System Prompt:
"""
${systemPrompt}
"""

Return strict JSON:
{
  "inputModalities": ["text"|"image"|"audio"|"video"|"code"],
  "outputModalities": ["text"|"image"|"audio"|"video"|"code"],
  "expertise": [{"domain": "string", "subDomains": ["string"], "confidenceScore": 0.0-1.0}]
}`;

    try {
      const res = await osGenerate(prompt, { responseFormat: "json" });
      const parsed = JSON.parse(res.content);
      return {
        inputModalities: parsed.inputModalities ?? ["text"],
        outputModalities: parsed.outputModalities ?? ["text"],
        expertise: parsed.expertise ?? [],
      };
    } catch {
      return { inputModalities: ["text"], outputModalities: ["text"], expertise: [] };
    }
  }
}