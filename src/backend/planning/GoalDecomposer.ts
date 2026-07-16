import { generateText } from "ai";
import type { Subtask, TaskPriority } from "./types";

export class GoalDecomposer {
  static async decompose(
    goal: string,
    context: { userId: string; availableAgents: string[] },
  ): Promise<Subtask[]> {
    console.log(`[GoalDecomposer] Decomposing goal: "${goal}"`);

    const prompt = `
You are an expert project manager breaking down complex goals into actionable subtasks.

**Goal:** ${goal}

**Available Agents:** ${context.availableAgents.join(", ")}

Break this goal into 3-7 concrete subtasks with dependencies and priority.

Respond ONLY with valid JSON in this exact shape:
{"subtasks":[{"id":"subtask_1","description":"...","priority":"high|medium|low","dependencies":[]}]}
`;

    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured on the server.");
      const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
      const gateway = createLovableAiGatewayProvider(apiKey);

      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt,
        temperature: 0.3,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      return (parsed.subtasks as any[]).map((task, index) => ({
        id: `subtask_${index + 1}`,
        goalId: "",
        description: task.description,
        status: "pending" as const,
        priority: (task.priority as TaskPriority) ?? "medium",
        dependencies: task.dependencies || [],
        retryCount: 0,
        maxRetries: 3,
      }));
    } catch (error: any) {
      console.error("[GoalDecomposer] Failed to decompose goal:", error);
      return [
        {
          id: "subtask_1",
          goalId: "",
          description: goal,
          status: "pending",
          priority: "medium",
          dependencies: [],
          retryCount: 0,
          maxRetries: 3,
        },
      ];
    }
  }
}