// src/backend/tools/builtins/WebSearchTool.ts
import { z } from "zod";
import { ToolDefinition } from "../types";

export const WebSearchTool: ToolDefinition = {
  name: "web_search",
  description: "Search the web for information using a search engine.",
  requiresAuth: false,
  parameters: z.object({
    query: z.string().min(1).describe("The search query string"),
    limit: z.number().int().min(1).max(20).optional().default(5),
    safe: z.boolean().optional().default(true),
  }),
  execute: async (args, _ctx) => {
    const start = Date.now();
    try {
      const { query, limit, safe } = args;
      let data: any;
      if (process.env.SERPER_API_KEY) {
        const r = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: query, num: limit }),
        });
        if (!r.ok) throw new Error(`Serper API error: ${r.status}`);
        const d = await r.json();
        data = (d.organic || []).map((x: any) => ({
          title: x.title, url: x.link, snippet: x.snippet, source: "serper",
        }));
      } else if (process.env.BING_API_KEY) {
        const r = await fetch(
          `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${limit}`,
          { headers: { "Ocp-Apim-Subscription-Key": process.env.BING_API_KEY! } },
        );
        if (!r.ok) throw new Error(`Bing API error: ${r.status}`);
        const d = await r.json();
        data = (d.webPages?.value || []).map((x: any) => ({
          title: x.name, url: x.url, snippet: x.snippet, source: "bing",
        }));
      } else {
        data = Array.from({ length: limit }, (_, i) => ({
          title: `Result ${i + 1} for "${query}"`,
          url: `https://example.com/search-result-${i + 1}`,
          snippet: `Placeholder result for "${query}". Configure SERPER_API_KEY or BING_API_KEY.`,
          source: "mock",
        }));
      }
      return { success: true, data: { query, safe, results: data }, executionTimeMs: Date.now() - start };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e), executionTimeMs: Date.now() - start };
    }
  },
};
