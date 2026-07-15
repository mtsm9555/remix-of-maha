import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageDataUrl: z
    .string()
    .min(32)
    .max(15_000_000)
    .refine((v) => v.startsWith("data:image/"), "must be a data:image/... URL"),
  instruction: z.string().max(500).optional(),
});

export const extractTextFromImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const prompt =
      data.instruction?.trim() ||
      "Extract ALL visible text from this screenshot verbatim. Preserve line breaks and reading order. Return only the text — no commentary.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Rate limit. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace billing.");
      throw new Error(`Vision failed [${res.status}]: ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { text };
  });
