// src/backend/tools/builtins/BrowserScrapeTool.ts
import { z } from "zod";
import { ToolDefinition } from "../types";

export const BrowserScrapeTool: ToolDefinition = {
  name: "browser_scrape",
  description: "Scrape a webpage and extract text, links, or structured data.",
  requiresAuth: false,
  parameters: z.object({
    url: z.string().url(),
    selector: z.string().optional(),
    extract: z.enum(["text", "links", "html", "structured"]).optional().default("text"),
    waitFor: z.number().int().min(0).optional().default(0),
  }),
  execute: async (args) => {
    const start = Date.now();
    try {
      if (process.env.FIRECRAWL_API_KEY) {
        const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: args.url, formats: ["markdown", "html"] }),
        });
        if (!r.ok) throw new Error(`Firecrawl API error: ${r.status}`);
        const d = await r.json();
        return {
          success: true,
          data: {
            url: args.url,
            title: d.data?.metadata?.title ?? "",
            content: d.data?.markdown ?? d.data?.html ?? "",
            links: d.data?.links ?? [],
            source: "firecrawl",
          },
          executionTimeMs: Date.now() - start,
        };
      }

      const r = await fetch(args.url, { headers: { "User-Agent": "MahaBot/1.0 (AI Assistant)" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      const html = await r.text();
      const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ?? "";
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 10000);
      const links = [...new Set([...html.matchAll(/href=["'](.*?)["']/gi)].map((m) => m[1]))].slice(0, 50);
      return {
        success: true,
        data: {
          url: args.url, title,
          text: args.selector ? `[Selector "${args.selector}" not implemented in fetch mode]` : text,
          links,
          html: args.extract === "html" ? html.substring(0, 50000) : undefined,
          source: "fetch",
        },
        executionTimeMs: Date.now() - start,
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e), executionTimeMs: Date.now() - start };
    }
  },
};
