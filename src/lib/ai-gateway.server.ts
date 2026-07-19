import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Lovable AI Gateway expects the key in the `Lovable-API-Key` header.
// Provider name must be "lovable" so `providerOptions.lovable` is forwarded.
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}