// src/backend/tools/builtins/BrowserScrapeTool.ts
import { BaseTool, ToolSchema, ToolExecutionContext } from "../types";

export class BrowserScrapeTool extends BaseTool {
  schema: ToolSchema = {
    name: "browser_scrape",
    description: "Scrape a webpage and extract text, links, or structured data.",
    category: "browser",
    risk: "medium",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "The URL to scrape",
        required: true,
      },
      {
        name: "selector",
        type: "string",
        description: "CSS selector to target specific elements (optional)",
        required: false,
      },
      {
        name: "extract",
        type: "string",
        description: "What to extract: text, links, html, or structured",
        required: false,
        default: "text",
        enum: ["text", "links", "html", "structured"],
      },
      {
        name: "waitFor",
        type: "number",
        description: "Milliseconds to wait for dynamic content",
        required: false,
        default: 0,
      },
    ],
    returns: {
      type: "object",
      description: "Extracted content from the webpage",
    },
    examples: [
      '{ "url": "https://example.com", "extract": "text" }',
      '{ "url": "https://example.com", "selector": "article", "extract": "structured" }',
    ],
  };

  async execute(params: Record<string, any>, _context: ToolExecutionContext): Promise<any> {
    const url = params.url as string;
    const selector = params.selector as string | undefined;
    const extract = params.extract ?? "text";
    const waitFor = params.waitFor ?? 0;

    // Production: integrate with PlaywrightWorker or Firecrawl
    // This skeleton provides the interface; wire to your AutomationRuntime
    if (process.env.FIRECRAWL_API_KEY) {
      return this.scrapeFirecrawl(url, selector, extract);
    }

    // Fallback: fetch basic HTML
    return this.scrapeFetch(url, selector, extract);
  }

  private async scrapeFirecrawl(url: string, _selector: string | undefined, _extract: string): Promise<any> {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown", "html"] }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      url,
      title: data.data?.metadata?.title ?? "",
      content: data.data?.markdown ?? data.data?.html ?? "",
      links: data.data?.links ?? [],
      source: "firecrawl",
    };
  }

  private async scrapeFetch(url: string, selector: string | undefined, extract: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MahaBot/1.0 (AI Assistant)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Basic extraction without a full DOM parser
    // Production: use PlaywrightWorker for JS-rendered pages
    const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ?? "";
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 10000);

    const links = [...html.matchAll(/href=["'](.*?)["']/gi)].map((m) => m[1]);

    return {
      url,
      title,
      text: selector ? `[Selector "${selector}" not implemented in fetch mode]` : text,
      links: [...new Set(links)].slice(0, 50),
      html: extract === "html" ? html.substring(0, 50000) : undefined,
      source: "fetch",
    };
  }
}
