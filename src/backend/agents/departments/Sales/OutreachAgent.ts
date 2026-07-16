// src/backend/agents/departments/Sales/OutreachAgent.ts
import { BaseAgent } from "../BaseAgent";

export class OutreachAgent extends BaseAgent {
  constructor() {
    super({
      id: 'sales-outreach-agent',
      name: 'Outreach Agent',
      department: 'sales',
      role: 'Sales Outreach Specialist',
      goal: 'Create personalized, high-converting sales outreach',
      tools: ['email', 'linkedin', 'calendar', 'crm']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const channel = context.channel || 'email';
    const tone = context.tone || 'professional';
    const recipient = context.recipient || {};

    return `
You are the Outreach Agent in the Sales Department of Maha AI OS.

**Your Role:**
You are an expert sales outreach specialist who crafts personalized, compelling messages that get responses and drive conversions.

**Your Capabilities:**
- Write personalized cold emails that get 30%+ response rates
- Craft LinkedIn messages that build relationships
- Create follow-up sequences
- Write value propositions
- A/B test subject lines and messaging
- Adapt tone for different audiences

**Current Task:**
${task}

**Channel:** ${channel}
**Tone:** ${tone}
**Recipient:** ${JSON.stringify(recipient, null, 2)}

**Instructions:**
1. Research the recipient and their pain points
2. Craft a compelling hook in first line
3. Clearly articulate value proposition
4. Include social proof if available
5. Add clear, specific call-to-action
6. Keep it concise (under 150 words for email)
7. Personalize based on recipient's role/industry

**Output Format:**
- Subject Line (for email)
- Message Body
- Follow-up Sequence (3 emails)
- A/B Test Variations
- Best Send Time
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'outreach',
      subject: this.extractSubject(response),
      message: this.extractMessage(response),
      followUps: this.extractFollowUps(response),
      variations: this.extractVariations(response),
      channel: context.channel || 'email',
      taskCompleted: true
    };
  }

  private extractSubject(response: string): string {
    const match = response.match(/Subject(?: Line)?:\s*([^\n]+)/i);
    return match ? match[1].trim() : '';
  }

  private extractMessage(response: string): string {
    const match = response.match(/Message Body:([\s\S]*?)(?:Follow-up|$)/i);
    return match ? match[1].trim() : '';
  }

  private extractFollowUps(response: string): string[] {
    const match = response.match(/Follow-up Sequence:([\s\S]*?)(?:A\/B Test|$)/i);
    if (!match) return [];
    return match[1].split(/Email \d+:/i).filter(s => s.trim()).slice(1, 4);
  }

  private extractVariations(response: string): string[] {
    const match = response.match(/A\/B Test Variations:([\s\S]*?)(?:Best Send Time|$)/i);
    if (!match) return [];
    return match[1].split(/Variation \d+:/i).filter(s => s.trim()).slice(1, 3);
  }
}