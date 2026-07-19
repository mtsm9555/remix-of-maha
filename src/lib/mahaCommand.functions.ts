import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const askSchema = z.object({ prompt: z.string().min(1).max(4000) });

export const askMaha = createServerFn({ method: "POST" })
  .validator((data: unknown) => askSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system:
        "You are MAHA — a concise, friendly AI operating system assistant. Answer in 1-3 short sentences unless asked for detail.",
      prompt: data.prompt,
    });
    return { reply: text };
  });

const transcribeSchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().default("audio/webm"),
});

export const transcribeMaha = createServerFn({ method: "POST" })
  .validator((data: unknown) => transcribeSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const bytes = Buffer.from(data.audioBase64, "base64");
    const mt = data.mimeType.split(";")[0];
    const ext =
      mt.includes("mp4") ? "mp4" :
      mt.includes("mpeg") ? "mp3" :
      mt.includes("wav") ? "wav" :
      mt.includes("m4a") ? "m4a" : "webm";

    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", new Blob([bytes], { type: mt }), `recording.${ext}`);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Transcription failed: ${res.status} ${err}`);
    }
    const json = (await res.json()) as { text?: string };
    return { text: json.text ?? "" };
  });

const analyzeSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().default("image/png"),
  prompt: z.string().default("Describe this image in 2-3 sentences. List key objects."),
});

export const analyzeImage = createServerFn({ method: "POST" })
  .validator((data: unknown) => analyzeSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");
    const gateway = createLovableAiGatewayProvider(key);
    const dataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: data.prompt },
            { type: "image", image: dataUrl },
          ],
        },
      ],
    });
    return { analysis: text };
  });
