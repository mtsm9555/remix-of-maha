import { BaseAgent } from "../BaseAgent";

export class ContentAgent extends BaseAgent {
  constructor() {
    super({
      id: "marketing-content-agent",
      name: "Content Agent",
      department: "marketing",
      role: "Content Strategist & Writer",
      goal: "Create engaging, high-quality content that resonates with target audiences",
      tools: ["blog-cms", "google-docs", "grammarly"],
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const contentType = context.contentType || "blog post";
    const targetAudience = context.targetAudience || "general audience";
    const tone = context.tone || "professional";
    const keywords: string[] = context.keywords || [];
    return `
You are the Content Agent in the Marketing Department of Maha AI OS.

**Current Task:** ${task}

**Content Specifications:**
- Type: ${contentType}
- Target Audience: ${targetAudience}
- Tone: ${tone}
- Keywords: ${keywords.join(", ")}
- Length: ${context.length || "medium (500-800 words)"}

**Context:**
${JSON.stringify(context, null, 2)}

Write engaging, SEO-aware content with a strong hook, clear structure, and a call-to-action.
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: "content",
      content: response,
      wordCount: response.split(/\s+/).length,
      contentType: context.contentType || "blog post",
      metadata: {
        readabilityScore: this.calculateReadability(response),
        keywordDensity: this.analyzeKeywords(response, context.keywords || []),
      },
      taskCompleted: true,
    };
  }

  private calculateReadability(text: string): number {
    const sentences = Math.max(1, text.split(/[.!?]+/).length);
    const words = Math.max(1, text.split(/\s+/).length);
    const syllables = Math.max(1, this.countSyllables(text));
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    return Math.max(1, text.toLowerCase().split(/[aeiouy]+/).length - 1);
  }

  private analyzeKeywords(text: string, keywords: string[]): Record<string, number> {
    const textLower = text.toLowerCase();
    const words = Math.max(1, textLower.split(/\s+/).length);
    const density: Record<string, number> = {};
    for (const kw of keywords) {
      const matches = (textLower.match(new RegExp(kw.toLowerCase(), "g")) || []).length;
      density[kw] = (matches / words) * 100;
    }
    return density;
  }
}