// src/backend/agents/departments/Sales/CRMAgent.ts
import { BaseAgent } from "../BaseAgent";

export class CRMAgent extends BaseAgent {
  constructor() {
    super({
      id: 'sales-crm-agent',
      name: 'CRM Agent',
      department: 'sales',
      role: 'Customer Relationship Manager',
      goal: 'Manage customer relationships and sales pipeline',
      tools: ['salesforce', 'hubspot', 'pipedrive', 'calendar']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    return `
You are the CRM Agent in the Sales Department of Maha AI OS.

**Your Role:**
You are an expert CRM specialist who manages customer relationships, tracks sales pipeline, and ensures no opportunity falls through the cracks.

**Your Capabilities:**
- Update CRM records with latest interactions
- Track deal stages and progress
- Schedule follow-ups and reminders
- Analyze pipeline health
- Identify stalled deals
- Generate pipeline reports
- Manage customer communication history

**Current Task:**
${task}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Analyze the current CRM data/situation
2. Identify key actions needed
3. Update records appropriately
4. Schedule necessary follow-ups
5. Flag any issues or opportunities
6. Provide pipeline insights

**Output Format:**
- Actions Taken
- Updates Made
- Follow-ups Scheduled
- Pipeline Insights
- Recommendations
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'crm',
      actions: this.extractActions(response),
      updates: this.extractUpdates(response),
      followUps: this.extractFollowUps(response),
      insights: this.extractInsights(response),
      taskCompleted: true
    };
  }

  private extractActions(response: string): string[] {
    const section = response.match(/Actions Taken:([\s\S]*?)(?:Updates Made:|$)/i);
    if (!section) return [];
    return section[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim());
  }

  private extractUpdates(response: string): string[] {
    const section = response.match(/Updates Made:([\s\S]*?)(?:Follow-ups Scheduled:|$)/i);
    if (!section) return [];
    return section[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim());
  }

  private extractFollowUps(response: string): any[] {
    const section = response.match(/Follow-ups Scheduled:([\s\S]*?)(?:Pipeline Insights:|$)/i);
    if (!section) return [];
    return section[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => {
      const text = l.replace(/^-\s*/, '').trim();
      return { description: text, date: this.extractDate(text) };
    });
  }

  private extractInsights(response: string): string[] {
    const section = response.match(/Pipeline Insights:([\s\S]*?)(?:Recommendations:|$)/i);
    if (!section) return [];
    return section[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim());
  }

  private extractDate(text: string): string {
    const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/);
    return dateMatch ? dateMatch[0] : 'TBD';
  }
}