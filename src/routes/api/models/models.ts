import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/models/models")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const capability = url.searchParams.get("capability");
        const provider = url.searchParams.get("provider");
        const { ModelRegistry } = await import("@/backend/infrastructure/models/ModelRegistry.server");
        let models = await ModelRegistry.getAllModels();
        if (capability) models = models.filter((m) => m.capabilities.includes(capability as any));
        if (provider) models = models.filter((m) => m.provider === provider);
        return Response.json({ models });
      },
      POST: async ({ request }) => {
        const body = (await request.json()) as any;
        const { ModelRegistry } = await import("@/backend/infrastructure/models/ModelRegistry.server");
        try {
          const model = await ModelRegistry.registerModel({
            provider: body.provider,
            modelName: body.modelName,
            displayName: body.displayName,
            capabilities: body.capabilities ?? ["text"],
            maxContextTokens: body.maxContextTokens ?? 4096,
            maxOutputTokens: body.maxOutputTokens ?? 2048,
            supportsStreaming: body.supportsStreaming ?? true,
            supportsVision: body.supportsVision ?? false,
            supportsFunctionCalling: body.supportsFunctionCalling ?? false,
            averageLatencyMs: body.averageLatencyMs ?? 1000,
            p95LatencyMs: body.p95LatencyMs ?? 2000,
            throughputTokensPerSecond: body.throughputTokensPerSecond ?? 50,
            costPerInputTokenUSD: body.costPerInputTokenUSD ?? 0,
            costPerOutputTokenUSD: body.costPerOutputTokenUSD ?? 0,
            costPerRequestUSD: body.costPerRequestUSD,
            isActive: body.isActive ?? true,
            isAvailable: body.isAvailable ?? true,
            rateLimitPerMinute: body.rateLimitPerMinute ?? 100,
            currentLoad: body.currentLoad ?? 0,
            version: body.version ?? "1.0",
            releasedAt: body.releasedAt ? new Date(body.releasedAt) : new Date(),
            metadata: body.metadata ?? {},
          });
          return Response.json({ model });
        } catch (err: any) {
          return Response.json({ error: err?.message ?? String(err) }, { status: 500 });
        }
      },
    },
  },
});