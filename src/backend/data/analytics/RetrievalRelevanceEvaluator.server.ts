import { RetrievalTracker } from "./RetrievalTracker.server";

/**
 * Uses the Lovable AI Gateway to score whether the fetched memories
 * actually contributed to the final agent output (0.0 - 1.0).
 */
export class RetrievalRelevanceEvaluator {
  static async evaluateRelevance(
    retrievalEventId: string,
    originalQuery: string,
    fetchedMemoriesText: string,
    finalAgentOutput: string,
  ): Promise<number> {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return 0.5;

    const prompt = `You are an AI Evaluator.
Decide if the "Fetched Memories" were actually used to generate the "Final Output" for the "Original Query".

Original Query: "${originalQuery}"
Fetched Memories: "${fetchedMemoriesText.substring(0, 1000)}"
Final Agent Output: "${finalAgentOutput.substring(0, 1000)}"

Rules:
- Output ignores memories, general knowledge only => 0.0
- Uses some memory facts, mostly general => 0.5
- Heavily relies on memory-specific facts => 1.0

Reply with a single number between 0.0 and 1.0. No prose.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
      });
      if (!res.ok) return 0.5;
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
      const match = raw.match(/[0-1](?:\.\d+)?/);
      const parsed = match ? parseFloat(match[0]) : NaN;
      const score = isNaN(parsed) ? 0.5 : Math.max(0, Math.min(1, parsed));
      await RetrievalTracker.updateRelevance(retrievalEventId, score);
      return score;
    } catch (err) {
      console.error("[RelevanceEvaluator] failed:", err);
      return 0.5;
    }
  }
}