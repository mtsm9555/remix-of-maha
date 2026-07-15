// src/lib/search.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const webSearch = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ query: z.string().min(1).max(500) }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "perplexity/sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a concise web-search assistant. Answer the user's query using current web sources. Reply in 3-6 sentences and end with a short list of source URLs.",
          },
          { role: "user", content: data.query },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Search failed: ${res.status} ${errText}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = json.choices?.[0]?.message?.content ?? "";
    return { answer };
  });
