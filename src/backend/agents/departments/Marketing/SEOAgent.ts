import { BaseAgent } from "../BaseAgent";

export class SEOAgent extends BaseAgent {
  constructor() {
    super({
      id: "marketing-seo-agent",
      name: "SEO Agent",
      department: "marketing",
      role: "SEO Specialist",
      goal: "Optimize content and websites for maximum search engine visibility",
      tools: ["google-search-console", "ahrefs", "semrush", "google-analytics"],
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    return `
You are the SEO Agent in the Marketing Department of Maha AI OS.

**Current Task:** ${task}

**Context:**
${JSON.stringify(context, null, 2)}

Return: SEO Audit Summary, Key Issues, Prioritized Recommendations, Implementation Plan, Expected Results.
`;
  }

  protected async processResponse(response: string, _context: Record<string, any>): Promise<any> {
    return {
      type: "seo",
      analysis: response,
      recommendations: this.extractRecommendations(response),
      priority: this.extractPriority(response),
      taskCompleted: true,
    };
  }

  private extractRecommendations(response: string): string[] {
    return response
      .split("\n")
      .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .slice(0, 10);
  }

  private extractPriority(response: string): string {
    const r = response.toLowerCase();
    if (r.includes("critical") || r.includes("urgent")) return "high";
    if (r.includes("important") || r.includes("should")) return "medium";
    return "low";
  }
}