import type { ContextChunk } from "../../os/context/ContextTypes";
import { CompressionAlgorithms } from "./CompressionAlgorithms";
import type { CompressedContext, CompressionConfig, CompressionStrategy } from "./CompressionTypes";

export class ContextCompressionEngine {
  static async compress(
    chunks: ContextChunk[],
    config: CompressionConfig,
  ): Promise<CompressedContext> {
    console.log(
      `[CompressionEngine] Compressing ${chunks.length} chunks. Target: ${config.maxTargetTokens} tokens.`,
    );

    const totalOriginalTokens = chunks.reduce((sum, c) => sum + c.tokenEstimate, 0);
    let currentTokens = 0;
    const compressedContents: string[] = [];
    let chunksDropped = 0;

    for (const chunk of chunks) {
      if (currentTokens + chunk.tokenEstimate > config.maxTargetTokens) {
        if (chunk.relevanceScore > 0.8) {
          const compressedText = await this.applyStrategy(chunk.content, config.preferredStrategy);
          const compressedTokens = Math.ceil(compressedText.length / 4);
          if (currentTokens + compressedTokens <= config.maxTargetTokens) {
            compressedContents.push(compressedText);
            currentTokens += compressedTokens;
            continue;
          }
        }
        chunksDropped++;
        continue;
      }

      let finalContent = chunk.content;
      if (config.preferredStrategy === "code_compress" && chunk.source === "tool_result") {
        finalContent = CompressionAlgorithms.compressCode(chunk.content);
      }
      compressedContents.push(finalContent);
      currentTokens += chunk.tokenEstimate;
    }

    const finalContent = compressedContents.join("\n\n---\n\n");
    const finalTokenCount = Math.ceil(finalContent.length / 4);

    return {
      originalTokenCount: totalOriginalTokens,
      compressedTokenCount: finalTokenCount,
      compressionRatio: totalOriginalTokens > 0 ? finalTokenCount / totalOriginalTokens : 1,
      content: finalContent,
      metadata: {
        strategyUsed: config.preferredStrategy,
        chunksProcessed: chunks.length,
        chunksDropped,
      },
    };
  }

  private static async applyStrategy(text: string, strategy: CompressionStrategy): Promise<string> {
    switch (strategy) {
      case "extract_decisions":
        return CompressionAlgorithms.extractDecisions(text);
      case "extract_entities":
        return CompressionAlgorithms.extractEntities(text);
      case "conversation_distill":
        return CompressionAlgorithms.distillConversation([{ role: "context", content: text }]);
      case "code_compress":
        return CompressionAlgorithms.compressCode(text);
      case "summarize":
      default:
        return CompressionAlgorithms.summarizeText(text, 250);
    }
  }
}
