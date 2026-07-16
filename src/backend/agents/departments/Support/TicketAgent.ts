// src/backend/agents/departments/Support/TicketAgent.ts
import { BaseAgent } from "../BaseAgent";

export class TicketAgent extends BaseAgent {
  constructor() {
    super({
      id: 'support-ticket-agent',
      name: 'Ticket Agent',
      department: 'support',
      role: 'Support Ticket Manager & Router',
      goal: 'Manage, categorize, prioritize, and route support tickets efficiently',
      tools: ['zendesk', 'freshdesk', 'jira', 'intercom', 'ticketing-system']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const ticketData = context.ticket || {};
    const action = context.action || 'process'; // process, categorize, prioritize, route

    return `
You are the Ticket Agent in the Customer Support Department of Maha AI OS.

**Your Role:**
You are an expert support ticket manager who efficiently processes, categorizes, prioritizes, and routes tickets to ensure fast resolution and optimal resource allocation.

**Your Capabilities:**
- Categorize tickets by type (technical, billing, feature request, bug, etc.)
- Prioritize based on urgency, impact, and SLA
- Route tickets to appropriate teams/agents
- Detect duplicate tickets
- Identify patterns in recurring issues
- Update ticket status and metadata
- Generate ticket summaries
- Suggest automated responses
- Track SLA compliance
- Merge related tickets

**Current Task:**
${task}

**Action:** ${action}
**Ticket Data:** ${JSON.stringify(ticketData, null, 2)}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Analyze the ticket content thoroughly
2. Categorize by type and subcategory
3. Assess urgency (Critical/High/Medium/Low)
4. Assess impact (Single user/Multiple users/System-wide)
5. Determine priority score (P1-P4)
6. Identify the best team/agent to handle it
7. Check for duplicates or related tickets
8. Generate a clear ticket summary
9. Suggest initial response template
10. Set SLA expectations

**Output Format:**
- Ticket Summary
- Category & Subcategory
- Priority Level (P1-P4)
- Urgency Assessment
- Impact Assessment
- Assigned Team/Agent
- SLA Timeline
- Duplicate Check Result
- Suggested Response Template
- Tags & Labels
- Next Steps
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'ticket',
      summary: this.extractSection(response, 'Ticket Summary'),
      category: this.extractField(response, 'Category'),
      subcategory: this.extractField(response, 'Subcategory'),
      priority: this.extractPriority(response),
      urgency: this.extractField(response, 'Urgency'),
      impact: this.extractField(response, 'Impact'),
      assignedTo: this.extractField(response, 'Assigned'),
      sla: this.extractField(response, 'SLA'),
      isDuplicate: this.checkDuplicate(response),
      responseTemplate: this.extractSection(response, 'Suggested Response'),
      tags: this.extractTags(response),
      nextSteps: this.extractList(response, 'Next Steps'),
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractField(response: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}[\\s\\w]*[:\\s]+([^\\n]+)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractPriority(response: string): string {
    const match = response.match(/P[1-4]|Critical|High|Medium|Low/i);
    if (!match) return 'P3';
    
    const value = match[0].toUpperCase();
    if (value === 'CRITICAL' || value === 'P1') return 'P1';
    if (value === 'HIGH' || value === 'P2') return 'P2';
    if (value === 'MEDIUM' || value === 'P3') return 'P3';
    if (value === 'LOW' || value === 'P4') return 'P4';
    return value;
  }

  private checkDuplicate(response: string): boolean {
    const section = this.extractSection(response, 'Duplicate');
    const lower = section.toLowerCase();
    return lower.includes('yes') || lower.includes('duplicate found') || lower.includes('likely duplicate');
  }

  private extractTags(response: string): string[] {
    const section = this.extractSection(response, 'Tags');
    return section.split(/[,|\n]/)
      .map(t => t.replace(/^[-•\s]+/, '').trim())
      .filter(t => t.length > 0 && t.length < 30)
      .slice(0, 10);
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 5)
      .map(s => s.trim());
  }
}