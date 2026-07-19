import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { errorResponse, MahaError } from "@/lib/errors";

export const Route = createFileRoute("/api/maha/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as { prompt?: unknown };
          const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
          if (!prompt) throw new MahaError("bad_request", "Missing or empty prompt.");
          if (prompt.length > 4000) {
            throw new MahaError("bad_request", "Prompt is too long (max 4000 chars).");
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) throw new MahaError("server_error", "AI service is not configured.");

          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system:
              "You are MAHA — a concise, friendly AI operating system assistant. Answer in 1-3 short sentences unless asked for detail.",
            prompt,
            onError: ({ error }) => {
              console.error("[/api/maha/stream] streamText error:", error);
            },
          });

          return result.toTextStreamResponse({
            headers: { "Cache-Control": "no-store" },
          });
        } catch (err) {
          console.error("[/api/maha/stream] handler error:", err);
          return errorResponse(err);
        }
      },
    },
  },
});