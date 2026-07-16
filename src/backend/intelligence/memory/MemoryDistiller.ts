import { osGenerate } from "../../os/llm";
import type { ExtractedMemory, RawMemory } from "./ConsolidationTypes";

export class MemoryDistiller {
  static async distill(rawMemories: RawMemory[]): Promise<ExtractedMemory[]> {
    if (rawMemories.length === 0) return [];

    const formattedInput = rawMemories
      .map((m) => `[${new Date(m.timestamp).toISOString()}] (${m.source}): ${m.content}`)
      .join("\n");

    const prompt = `You are the Memory Consolidation Engine.
Analyze raw operational logs and extract long-term institutional knowledge.

**Raw Logs:**
${formattedInput}

**Instructions:**
1. Identify actionable procedures (procedural).
2. Identify semantic facts (domain knowledge, client preferences).
3. Identify entities and their relationships.
4. Discard redundant/trivial info.
5. Score importance 0.0 - 1.0.

**Output strict JSON:**
{ "extractedMemories": [ { "type": "procedural"|"semantic"|"episodic", "content": "string", "entities": ["string"], "relationships": [{"source":"string","relation":"string","target":"string"}], "importanceScore": 0.0 } ] }`;

    try {
      const response = await osGenerate(prompt, { responseFormat: "json" });
      const parsed = JSON.parse(response.content);
      return (parsed.extractedMemories as ExtractedMemory[]) || [];
    } catch (error) {
      console.error("[MemoryDistiller] Failed:", error);
      return [];
    }
  }
}
