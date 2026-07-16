import { ContextSources } from "./ContextSources";
import { ContextRanker } from "./ContextRanker";
import type { BuiltContext, ContextChunk, ContextRequest } from "./ContextTypes";
import { ContextCompressionEngine } from "../../intelligence/compression/ContextCompressionEngine";
import type { CompressionConfig } from "../../intelligence/compression/CompressionTypes";

export class OSContextBuilder {
  static async build(request: ContextRequest): Promise<BuiltContext> {
    console.log(
      `[OSContextBuilder] Building context for task: "${request.currentTask.substring(0, 50)}..."`,
    );

    const [osStateChunks, deptChunks, memoryChunks, graphChunks] = await Promise.all([
      ContextSources.getOSState(request),
      ContextSources.getDepartmentContext(request),
      ContextSources.getMemoryContext(request),
      ContextSources.getGraphContext(request),
    ]);

    const allChunks = [...osStateChunks, ...deptChunks, ...memoryChunks, ...graphChunks];
    const { kept, discardedTokens } = ContextRanker.rankAndTrim(allChunks, request.maxTokens * 2);

    const compressionConfig: CompressionConfig = {
      maxTargetTokens: request.maxTokens,
      preferredStrategy: "summarize",
      preserveExactQuotes: true,
    };
    const compressedResult = await ContextCompressionEngine.compress(kept, compressionConfig);

    const assembledPrompt = this.assemblePrompt(
      [
        {
          id: "compressed_main",
          source: "compressed",
          content: compressedResult.content,
          relevanceScore: 1.0,
          tokenEstimate: compressedResult.compressedTokenCount,
        },
      ],
      request.currentTask,
    );

    return {
      assembledPrompt,
      chunks: kept,
      totalTokens: compressedResult.compressedTokenCount,
      discardedTokens:
        discardedTokens + (compressedResult.originalTokenCount - compressedResult.compressedTokenCount),
    };
  }

  private static assemblePrompt(chunks: ContextChunk[], currentTask: string): string {
    let prompt = `<CURRENT_TASK>\n${currentTask}\n</CURRENT_TASK>\n\n`;
    const grouped = chunks.reduce(
      (acc, chunk) => {
        (acc[chunk.source] ||= []).push(chunk.content);
        return acc;
      },
      {} as Record<string, string[]>,
    );
    const sourceOrder = ["os_state", "department", "memory", "knowledge_graph"] as const;
    for (const source of sourceOrder) {
      if (grouped[source]) prompt += grouped[source].join("\n\n") + "\n\n";
    }
    if (grouped.compressed) prompt += grouped.compressed.join("\n\n") + "\n\n";
    prompt += `<INSTRUCTIONS>\nUse the above context to inform your execution of the CURRENT_TASK. Do not hallucinate information outside this context.\n</INSTRUCTIONS>`;
    return prompt;
  }
}

export * from "./ContextTypes";