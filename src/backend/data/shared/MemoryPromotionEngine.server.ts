import { SharedMemoryStore } from "./SharedMemoryStore.server";
import type { AccessLevel } from "./SharedMemoryTypes";

interface EvaluationResult {
  promoted: boolean;
  reason: string;
  proposedAccessLevel?: AccessLevel;
}

/**
 * Uses the Lovable AI Gateway to decide whether a department memory
 * has organization-wide value and, if so, files a promotion request.
 */
export class MemoryPromotionEngine {
  static async evaluateForPromotion(
    sourceMemoryId: string,
    content: string,
    sourceDepartment: string,
    requesterId: string,
  ): Promise<EvaluationResult> {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { promoted: false, reason: "AI evaluation unavailable (missing LOVABLE_API_KEY)." };
    }

    const prompt = `You are the Chief Knowledge Officer.
Decide if the following departmental memory has GLOBAL organizational value.

Source Department: ${sourceDepartment}
Memory: "${content}"

Criteria:
1. Applies across multiple departments.
2. Is a company-wide policy or brand guideline.
3. Prevents an organizational risk.

Reply ONLY as JSON:
{"shouldPromote": boolean, "proposedAccessLevel": "public"|"internal"|"confidential"|"restricted", "justification": string}`;

    let parsed: {
      shouldPromote?: boolean;
      proposedAccessLevel?: AccessLevel;
      justification?: string;
    } = {};
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Respond with strict JSON only." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });
      if (!res.ok) {
        return { promoted: false, reason: `AI gateway error: ${res.status}` };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content ?? "{}";
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("[PromotionEngine] evaluation failed:", err);
      return { promoted: false, reason: "Evaluation error." };
    }

    if (!parsed.shouldPromote) {
      return {
        promoted: false,
        reason: parsed.justification ?? "Not globally relevant.",
      };
    }

    const level: AccessLevel = parsed.proposedAccessLevel ?? "internal";
    await SharedMemoryStore.createPromotionRequest({
      sourceMemoryId,
      sourceDepartment,
      proposedContent: content,
      proposedAccessLevel: level,
      justification: parsed.justification ?? "Cross-department relevance detected.",
      requestedBy: requesterId,
    });

    return {
      promoted: true,
      reason: parsed.justification ?? "Promotion request created.",
      proposedAccessLevel: level,
    };
  }
}