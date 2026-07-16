import { createFileRoute } from "@tanstack/react-router";
import { ContextCompressionEngine } from "@/backend/intelligence/compression/ContextCompressionEngine";
import type { CompressionConfig, CompressionStrategy } from "@/backend/intelligence/compression/CompressionTypes";

export const Route = createFileRoute("/api/intelligence/compression/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          text: string;
          strategy?: CompressionStrategy;
          maxTokens?: number;
        };
        const config: CompressionConfig = {
          maxTargetTokens: body.maxTokens ?? 500,
          preferredStrategy: body.strategy ?? "summarize",
          preserveExactQuotes: false,
        };
        const result = await ContextCompressionEngine.compress(
          [
            {
              id: "test",
              source: "os_state",
              content: body.text,
              relevanceScore: 1.0,
              tokenEstimate: Math.ceil(body.text.length / 4),
            },
          ],
          config,
        );
        return Response.json({ result });
      },
    },
  },
});
