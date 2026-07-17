import { UserMemoryStore } from "./UserMemoryStore.server";

interface InferredMemory {
  type: "explicit_preference" | "implicit_pattern" | "biographical_fact";
  content: string;
  confidenceScore: number;
}

async function llmExtract(prompt: string): Promise<{ newMemories: InferredMemory[] }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { newMemories: [] };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    console.error("[UserAnalyzer] LLM call failed", res.status);
    return { newMemories: [] };
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  try {
    return JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return { newMemories: [] };
  }
}

export class UserInteractionAnalyzer {
  static async analyzeInteraction(
    userId: string,
    userMessage: string,
    agentResponse: string,
    context: { department?: string; taskType?: string },
  ): Promise<number> {
    const prompt = `You are an expert User Profiling AI.
Analyze the following interaction between a User and the Maha AI OS.
Extract new insights about the user's preferences, communication style, or behavioral patterns.

**User Message:**
"${userMessage}"

**Agent Response:**
"${agentResponse.slice(0, 500)}..."

**Context:**
Department: ${context.department ?? "General"}
Task Type: ${context.taskType ?? "General Query"}

**Instructions:**
1. Identify explicit preferences (e.g., "User asked for bullet points" -> prefers concise formatting).
2. Identify implicit patterns (e.g., User asking about server logs at 2 AM -> night owl / ops role).
3. Ignore one-off requests; focus on recurring traits or strong preferences.
4. If no new significant insights are found, return an empty array.

**Output strictly in JSON:**
{
  "newMemories": [
    { "type": "explicit_preference" | "implicit_pattern" | "biographical_fact", "content": "string", "confidenceScore": number }
  ]
}`;

    try {
      const parsed = await llmExtract(prompt);
      let stored = 0;
      for (const mem of parsed.newMemories ?? []) {
        if (!mem?.content || !mem?.type) continue;
        await UserMemoryStore.storeMemory({
          userId,
          type: mem.type,
          content: mem.content,
          metadata: {
            source: "ai_inferred",
            confidenceScore: mem.confidenceScore ?? 0.5,
          },
        });
        stored++;
      }
      return stored;
    } catch (err) {
      console.error("[UserAnalyzer] Failed:", err);
      return 0;
    }
  }
}