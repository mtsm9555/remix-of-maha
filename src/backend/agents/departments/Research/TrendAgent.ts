// src/backend/agents/departments/Research/TrendAgent.ts
import { BaseAgent } from "../BaseAgent";

export class TrendAgent extends BaseAgent {
  constructor() {
    super({
      id: 'research-trend-agent',
      name: 'Trend Agent',
      department: 'research',
      role: 'Industry Trend & Future Forecasting Specialist',
      goal: 'Monitor and analyze industry trends to predict future developments',
      tools: ['web-search', 'news-feeds', 'industry-reports', 'social-media', 'analytics']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const industry = context.industry || '';
    const timeframe = context.timeframe || 'next 12 months';
    const trendType = context.trendType || 'all';
    const region = context.region || 'global';

    return `
You are the Trend Agent in the Research Department of Maha AI OS.

**Your Role:**
You are an expert trend analyst who monitors industry developments, identifies emerging patterns, and provides forward-looking insights to help businesses stay ahead of the curve.

**Your Capabilities:**
- Monitor industry news and developments
- Identify emerging trends and patterns
- Analyze technology adoption curves
- Track consumer behavior shifts
- Forecast market developments
- Identify disruptive innovations
- Analyze regulatory changes
- Monitor social media and cultural shifts
- Provide trend impact analysis
- Create trend reports and forecasts

**Current Task:**
${task}

**Industry:** ${industry}
**Timeframe:** ${timeframe}
**Trend Type:** ${trendType}
**Region:** ${region}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Research current industry landscape
2. Identify 5-10 key trends (emerging, growing, declining)
3. Analyze each trend's:
   - Current status
   - Growth trajectory
   - Key drivers
   - Potential impact
   - Timeline
4. Identify disruptive innovations
5. Analyze regulatory/environmental factors
6. Provide confidence levels for predictions
7. Suggest strategic implications
8. Recommend actions to leverage trends
9. Identify risks and threats
10. Create actionable insights

**Output Format:**
- Industry Overview
- Key Trends (detailed analysis for each)
  - Trend Name
  - Current Status (Emerging/Growing/Mature/Declining)
  - Growth Trajectory
  - Key Drivers
  - Impact Analysis
  - Timeline
  - Confidence Level (High/Medium/Low)
- Disruptive Innovations
- Regulatory & Environmental Factors
- Strategic Implications
- Recommended Actions
- Risks & Threats
- Future Outlook
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'trend',
      industryOverview: this.extractSection(response, 'Industry Overview'),
      trends: this.extractTrends(response),
      disruptions: this.extractList(response, 'Disruptive'),
      regulatory: this.extractSection(response, 'Regulatory'),
      implications: this.extractList(response, 'Strategic Implications'),
      actions: this.extractList(response, 'Recommended Actions'),
      risks: this.extractList(response, 'Risks'),
      outlook: this.extractSection(response, 'Future Outlook'),
      timeframe: context.timeframe || 'next 12 months',
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractTrends(response: string): any[] {
    const trendBlocks = response.split(/Trend\s*\d+[:\.]?|Trend Name:/i)
      .filter(s => s.trim().length > 50);
    
    return trendBlocks.slice(0, 10).map((block, i) => ({
      id: i + 1,
      name: this.extractField(block, 'name|trend'),
      status: this.extractStatus(block),
      trajectory: this.extractField(block, 'trajectory|growth'),
      drivers: this.extractListFromBlock(block, 'drivers'),
      impact: this.extractField(block, 'impact'),
      timeline: this.extractField(block, 'timeline'),
      confidence: this.extractConfidence(block)
    }));
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 10)
      .map(s => s.trim());
  }

  private extractListFromBlock(text: string, fieldName: string): string[] {
    const regex = new RegExp(`${fieldName}[:\\s]*([\\s\\S]*?)(?=\\n\\n|${fieldName}|$)`, 'i');
    const match = text.match(regex);
    if (!match) return [];
    
    return match[1].split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 5)
      .map(s => s.trim());
  }

  private extractField(text: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractStatus(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('emerging')) return 'emerging';
    if (lower.includes('growing')) return 'growing';
    if (lower.includes('mature')) return 'mature';
    if (lower.includes('declining')) return 'declining';
    return 'growing';
  }

  private extractConfidence(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('high confidence') || lower.includes('very likely')) return 'high';
    if (lower.includes('medium confidence') || lower.includes('likely')) return 'medium';
    if (lower.includes('low confidence') || lower.includes('uncertain')) return 'low';
    return 'medium';
  }
}