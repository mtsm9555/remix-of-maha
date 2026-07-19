import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/maha/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt } = (await request.json()) as { prompt?: string };
        if (!prompt || typeof prompt !== "string") {
          return new Response("Missing prompt", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY not configured", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system:
            "You are MAHA — a concise, friendly AI operating system assistant. Answer in 1-3 short sentences unless asked for detail.",
          prompt,
        });

        return result.toTextStreamResponse({
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});