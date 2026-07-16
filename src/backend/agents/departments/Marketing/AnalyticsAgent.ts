import { BaseAgent } from "../BaseAgent";

export class AnalyticsAgent extends BaseAgent {
  constructor() {
    super({
      id: "marketing-analytics-agent",
      name: "Analytics Agent",
      department: "marketing",
      role: "Marketing Analytics Specialist",
      goal: "Analyze marketing performance and provide data-driven insights",
      tools: ["google-analytics", "mixpanel", "hotjar", "tableau"],
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    return `
You are the Analytics Agent in the Marketing Department of Maha AI OS.

**Current Task:** ${task}

**Context:**
${JSON.stringify(context, null, 2)}

Return: Executive Summary, Key Metrics & KPIs, Trend Analysis, Insights, Recommendations, Next Steps.
`;
  }

  protected async processResponse(response: string, _context: Record<string, any>): Promise<any> {
    return {
      type: "analytics",
      report: response,
      metrics: this.extractMetrics(response),
      insights: this.extractInsights(response),
      recommendations: this.extractRecommendations(response),
      taskCompleted: true,
    };
  }

  private extractMetrics(response: string): Record<string, string> {
    const metrics: Record<string, string> = {};
    for (const line of response.split("\n")) {
      const m = line.match(/([\w\s]+):\s*([\d,.]+%?)/);
      if (m) metrics[m[1].trim()] = m[2];
    }
    return metrics;
  }

  private extractInsights(response: string): string[] {
    const s = response.match(/Insights?:([\s\S]*?)(?:Recommendations?:|Next Steps?:|$)/i);
    if (!s) return [];
    return s[1]
      .split("\n")
      .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•"))
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 10);
  }

  private extractRecommendations(response: string): string[] {
    const s = response.match(/Recommendations?:([\s\S]*?)(?:Next Steps?:|$)/i);
    if (!s) return [];
    return s[1]
      .split("\n")
      .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("•") || /^\d+\./.test(l.trim()))
      .map((l) => l.replace(/^[-•\d.]+\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 10);
  }
}