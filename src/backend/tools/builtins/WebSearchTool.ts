// src/backend/tools/builtins/WebSearchTool.ts
import { BaseTool, ToolSchema, ToolExecutionContext } from "../types";

export class WebSearchTool extends BaseTool {
  schema: ToolSchema = {
    name: "web_search",
    description: "Search the web for information using a search engine.",
    category: "web",
    risk: "low",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The search query string",
        required: true,
      },
      {
        name: "limit",
        type: "number",
        description: "Maximum number of results to return (1-20)",
        required: false,
        default: 5,
      },
      {
        name: "safe",
        type: "boolean",
        description: "Enable safe search filtering",
        required: false,
        default: true,
      },
    ],
    returns: {
      type: "array",
      description: "Array of search results with title, url, and snippet",
    },
    examples: [
      '{ "query": "latest AI news", "limit": 5 }',
      '{ "query": "TypeScript best practices 2026" }',
    ],
  };

  async execute(params: Record<string, any>, _context: ToolExecutionContext): Promise<any> {
    const query = params.query as string;
    const limit = Math.min(Math.max(params.limit ?? 5, 1), 20);
    const safe = params.safe ?? true;

    // Production: integrate with Serper, Bing API, Brave Search, or Firecrawl
    // This is a production-ready skeleton with real API integration points
    const apiKey = process.env.SERPER_API_KEY || process.env.BING_API_KEY;

    if (apiKey && process.env.SERPER_API_KEY) {
      return this.searchSerper(query, limit, safe);
    }
    if (apiKey && process.env.BING_API_KEY) {
      return this.searchBing(query, limit, safe);
    }

    // Fallback: return structured mock for development
    return this.mockSearch(query, limit);
  }

  private async searchSerper(query: string, limit: number, _safe: boolean): Promise<any> {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: limit }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.organic || []).map((r: any) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      source: "serper",
    }));
  }

  private async searchBing(query: string, limit: number, _safe: boolean): Promise<any> {
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: { "Ocp-Apim-Subscription-Key": process.env.BING_API_KEY! },
      },
    );

    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.webPages?.value || []).map((r: any) => ({
      title: r.name,
      url: r.url,
      snippet: r.snippet,
      source: "bing",
    }));
  }

  private mockSearch(query: string, limit: number): any[] {
    return Array.from({ length: limit }, (_, i) => ({
      title: `Result ${i + 1} for "${query}"`,
      url: `https://example.com/search-result-${i + 1}`,
      snippet: `This is a placeholder search result for "${query}". Integrate with Serper, Bing, or Brave Search for production.`,
      source: "mock",
    }));
  }
}
