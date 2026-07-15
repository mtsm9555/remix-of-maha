import type { RawMemoryLog, ConsolidatedMemory } from "./types";

export class MemoryProcessor {
  /**
   * Uses an LLM to compress raw logs and extract graph-ready entities.
   * TODO: wire to real ModelServer; currently returns a deterministic mock.
   */
  static async processLogs(rawLogs: RawMemoryLog[]): Promise<ConsolidatedMemory | null> {
    if (rawLogs.length === 0) return null;

    const combinedText = rawLogs.map((log) => log.content).join("\n");
    const userId = rawLogs[0].userId;

    console.log(`[MemoryProcessor] Compressing ${rawLogs.length} logs for user ${userId}`);

    try {
      const mockResponse = {
        summary:
          "User is building a J.A.R.V.I.S.-style AI OS named Maha, focusing on tool execution and context building.",
        entities: ["Maha", "J.A.R.V.I.S.", "Tool Registry", "Context Builder"],
        relationships: [
          { source: "User", relation: "BUILDING", target: "Maha" },
          { source: "Maha", relation: "INSPIRED_BY", target: "J.A.R.V.I.S." },
        ],
        importanceScore: 0.95,
      };

      void combinedText;

      return {
        id: crypto.randomUUID(),
        userId,
        summary: mockResponse.summary,
        entities: mockResponse.entities,
        relationships: mockResponse.relationships,
        importanceScore: mockResponse.importanceScore,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("[MemoryProcessor] LLM extraction failed:", error);
      return null;
    }
  }
}