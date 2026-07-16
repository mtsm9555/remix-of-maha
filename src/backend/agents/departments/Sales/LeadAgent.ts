// src/backend/agents/departments/Sales/LeadAgent.ts
import { BaseAgent } from "../BaseAgent";

export class LeadAgent extends BaseAgent {
  constructor() {
    super({
      id: 'sales-lead-agent',
      name: 'Lead Agent',
      department: 'sales',
      role: 'Lead Generation & Qualification Specialist',
      goal: 'Identify, qualify, and prioritize sales leads',
      tools: ['linkedin', 'email-finder', 'crm', 'web-search']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const industry = context.industry || 'general';
    const targetMarket = context.targetMarket || 'B2B';
    const leadCriteria = context.criteria || {};

    return `
You are the Lead Agent in the Sales Department of Maha AI OS.

**Your Role:**
You are an expert lead generation specialist who identifies, qualifies, and prioritizes high-value sales leads.

**Your Capabilities:**
- Identify potential leads based on criteria
- Qualify leads using BANT (Budget, Authority, Need, Timeline)
- Score leads by conversion probability
- Research company backgrounds
- Identify decision makers
- Suggest outreach strategies

**Current Task:**
${task}

**Target Market:** ${targetMarket}
**Industry:** ${industry}
**Lead Criteria:** ${JSON.stringify(leadCriteria, null, 2)}

**Instructions:**
1. Identify 5-10 qualified leads matching criteria
2. Research each lead's company and role
3. Qualify using BANT framework
4. Score each lead (1-10) by conversion probability
5. Provide contact information if available
6. Suggest personalized outreach approach

**Output Format:**
For each lead:
- Company Name
- Contact Person & Title
- Qualification Score (1-10)
- BANT Analysis
- Outreach Strategy
- Priority Level (High/Medium/Low)
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'leads',
      leads: this.extractLeads(response),
      totalLeads: this.countLeads(response),
      averageScore: this.calculateAverageScore(response),
      taskCompleted: true
    };
  }

  private extractLeads(response: string): any[] {
    // Extract lead blocks
    const leadBlocks = response.split(/Lead\s*\d+|Company Name:/i);
    const leads = [];

    for (let i = 1; i < leadBlocks.length && i <= 10; i++) {
      const block = leadBlocks[i];
      leads.push({
        company: this.extractField(block, 'company'),
        contact: this.extractField(block, 'contact'),
        title: this.extractField(block, 'title'),
        score: this.extractScore(block),
        qualification: this.extractBANT(block),
        strategy: this.extractField(block, 'strategy|outreach'),
        priority: this.extractPriority(block)
      });
    }

    return leads;
  }

  private extractField(text: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractScore(text: string): number {
    const match = text.match(/score[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) : 5;
  }

  private extractBANT(text: string): any {
    return {
      budget: this.extractField(text, 'budget'),
      authority: this.extractField(text, 'authority'),
      need: this.extractField(text, 'need'),
      timeline: this.extractField(text, 'timeline')
    };
  }

  private extractPriority(text: string): string {
    if (text.toLowerCase().includes('high priority')) return 'high';
    if (text.toLowerCase().includes('medium priority')) return 'medium';
    return 'low';
  }

  private countLeads(response: string): number {
    return (response.match(/Lead\s*\d+|Company Name:/gi) || []).length;
  }

  private calculateAverageScore(response: string): number {
    const scores = response.match(/score[:\s]+(\d+)/gi) || [];
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, s) => {
      const match = s.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
    return total / scores.length;
  }
}