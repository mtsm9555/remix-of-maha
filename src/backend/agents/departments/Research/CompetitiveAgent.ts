// src/backend/agents/departments/Research/CompetitiveAgent.ts
import { BaseAgent } from "../BaseAgent";

export class CompetitiveAgent extends BaseAgent {
  constructor() {
    super({
      id: 'research-competitive-agent',
      name: 'Competitive Agent',
      department: 'research',
      role: 'Competitive Intelligence & Market Analysis Specialist',
      goal: 'Analyze competitors and market landscape to identify opportunities',
      tools: ['web-search', 'market-reports', 'company-databases', 'social-media', 'reviews']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const industry = context.industry || '';
    const competitors = context.competitors || [];
    const analysisType = context.analysisType || 'comprehensive';
    const focus = context.focus || 'all';

    return `
You are the Competitive Agent in the Research Department of Maha AI OS.

**Your Role:**
You are an expert competitive intelligence specialist who analyzes competitors, market dynamics, and strategic positioning to identify opportunities and threats.

**Your Capabilities:**
- Conduct comprehensive competitor analysis
- Analyze competitor products, pricing, and positioning
- Identify competitor strengths and weaknesses
- Track competitor moves and strategies
- Analyze market share and trends
- Perform SWOT analysis
- Identify competitive advantages and gaps
- Benchmark against industry leaders
- Analyze competitor marketing and messaging
- Provide strategic recommendations

**Current Task:**
${task}

**Industry:** ${industry}
**Known Competitors:** ${competitors.join(', ')}
**Analysis Type:** ${analysisType}
**Focus Area:** ${focus}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Identify key competitors (if not provided)
2. Analyze each competitor's:
   - Products/Services
   - Pricing strategy
   - Target market
   - Strengths & Weaknesses
   - Recent moves/news
3. Perform SWOT analysis for each
4. Identify market gaps and opportunities
5. Benchmark features and pricing
6. Analyze competitor positioning
7. Provide strategic recommendations
8. Suggest competitive advantages to pursue

**Output Format:**
- Market Overview
- Competitor Profiles (for each competitor)
  - Company Overview
  - Products/Services
  - Pricing
  - Target Market
  - Strengths
  - Weaknesses
  - Recent Moves
- SWOT Analysis (per competitor)
- Competitive Landscape Map
- Market Gaps & Opportunities
- Feature/Pricing Benchmark
- Strategic Recommendations
- Threats to Monitor
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'competitive',
      marketOverview: this.extractSection(response, 'Market Overview'),
      competitors: this.extractCompetitors(response),
      swotAnalysis: this.extractSWOT(response),
      landscape: this.extractSection(response, 'Competitive Landscape'),
      opportunities: this.extractList(response, 'Opportunities'),
      benchmark: this.extractBenchmark(response),
      recommendations: this.extractList(response, 'Recommendations'),
      threats: this.extractList(response, 'Threats'),
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractCompetitors(response: string): any[] {
    const competitorBlocks = response.split(/Competitor\s*\d+[:\.]?|Company Overview:/i)
      .filter(s => s.trim().length > 50);
    
    return competitorBlocks.slice(0, 10).map((block, i) => ({
      id: i + 1,
      name: this.extractField(block, 'company|name'),
      overview: this.extractField(block, 'overview'),
      products: this.extractField(block, 'products'),
      pricing: this.extractField(block, 'pricing'),
      targetMarket: this.extractField(block, 'target'),
      strengths: this.extractListFromBlock(block, 'strengths'),
      weaknesses: this.extractListFromBlock(block, 'weaknesses'),
      recentMoves: this.extractListFromBlock(block, 'recent')
    }));
  }

  private extractSWOT(response: string): any[] {
    const swotSection = this.extractSection(response, 'SWOT');
    const swots = swotSection.split(/SWOT\s*(?:Analysis)?\s*\d+[:\.]?/i)
      .filter(s => s.trim().length > 20);
    
    return swots.slice(1).map((swot, i) => ({
      id: i + 1,
      strengths: this.extractListFromBlock(swot, 'strengths'),
      weaknesses: this.extractListFromBlock(swot, 'weaknesses'),
      opportunities: this.extractListFromBlock(swot, 'opportunities'),
      threats: this.extractListFromBlock(swot, 'threats')
    }));
  }

  private extractBenchmark(response: string): any {
    const section = this.extractSection(response, 'Benchmark');
    return {
      features: this.extractListFromBlock(section, 'features'),
      pricing: this.extractListFromBlock(section, 'pricing'),
      comparison: section.trim()
    };
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
}