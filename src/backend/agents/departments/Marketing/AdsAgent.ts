import { BaseAgent } from "../BaseAgent";

export class AdsAgent extends BaseAgent {
  constructor() {
    super({
      id: "marketing-ads-agent",
      name: "Ads Agent",
      department: "marketing",
      role: "Paid Advertising Specialist",
      goal: "Create and optimize high-converting ad campaigns",
      tools: ["google-ads", "meta-ads", "linkedin-ads", "twitter-ads"],
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const platform = context.platform || "Google Ads";
    const budget = context.budget || "not specified";
    const targetAudience = context.targetAudience || "general";
    return `
You are the Ads Agent in the Marketing Department of Maha AI OS.

**Current Task:** ${task}
**Platform:** ${platform}
**Budget:** ${budget}
**Target Audience:** ${targetAudience}

**Context:**
${JSON.stringify(context, null, 2)}

Return: Campaign Strategy, 3-5 Ad Variations (headline, description, CTA), Targeting, Budget Allocation, Optimization Tips, Expected Metrics.
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: "ads",
      campaign: response,
      adVariations: this.extractAdVariations(response),
      platform: context.platform || "Google Ads",
      targeting: this.extractTargeting(response),
      taskCompleted: true,
    };
  }

  private extractAdVariations(response: string): any[] {
    const variations: any[] = [];
    const blocks = response.split(/Ad\s*(?:Variation|Copy|Version)\s*\d+/i);
    for (let i = 1; i < blocks.length && i <= 5; i++) {
      const block = blocks[i];
      variations.push({
        number: i,
        headline: this.extractField(block, "headline"),
        description: this.extractField(block, "description"),
        cta: this.extractField(block, "cta|call[- ]?to[- ]?action"),
      });
    }
    return variations;
  }

  private extractField(text: string, fieldName: string): string {
    const m = text.match(new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, "i"));
    return m ? m[1].trim() : "";
  }

  private extractTargeting(response: string): any {
    const s = response.match(/Targeting:([\s\S]*?)(?:Budget|Optimization|$)/i);
    if (!s) return {};
    return {
      audience: s[1].trim(),
      demographics: this.extractDemographics(s[1]),
      interests: this.extractInterests(s[1]),
    };
  }

  private extractDemographics(text: string): string[] {
    return (text.match(/(?:age|gender|location|income)[:\s]+([^,\n]+)/gi) || []).map((m) => m.trim());
  }

  private extractInterests(text: string): string[] {
    return (text.match(/(?:interests?|keywords?)[:\s]+([^,\n]+)/gi) || []).map((m) => m.trim());
  }
}