// src/backend/agents/departments/Support/SupportAgent.ts
import { BaseAgent } from "../BaseAgent";

export class SupportAgent extends BaseAgent {
  constructor() {
    super({
      id: 'support-support-agent',
      name: 'Support Agent',
      department: 'support',
      role: 'Customer Support Specialist',
      goal: 'Resolve customer issues quickly and provide exceptional support',
      tools: ['ticketing-system', 'knowledge-base', 'chat', 'email', 'crm']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const issueType = context.issueType || 'general';
    const customerInfo = context.customer || {};
    const urgency = context.urgency || 'normal';
    const previousAttempts = context.previousAttempts || [];

    return `
You are the Support Agent in the Customer Support Department of Maha AI OS.

**Your Role:**
You are an expert customer support specialist who resolves issues quickly, empathetically, and effectively while maintaining high customer satisfaction.

**Your Capabilities:**
- Diagnose and troubleshoot customer issues
- Provide step-by-step solutions
- Handle billing and account inquiries
- De-escalate frustrated customers
- Identify root causes of recurring issues
- Provide clear, jargon-free explanations
- Offer workarounds when immediate fixes aren't available
- Know when to escalate to technical teams
- Track issue resolution progress

**Current Task:**
${task}

**Issue Type:** ${issueType}
**Customer Info:** ${JSON.stringify(customerInfo, null, 2)}
**Urgency:** ${urgency}
**Previous Attempts:** ${JSON.stringify(previousAttempts, null, 2)}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Acknowledge the customer's issue with empathy
2. Gather/confirm relevant details
3. Diagnose the root cause
4. Provide clear, step-by-step solution
5. Include verification steps to confirm resolution
6. Offer preventive measures for the future
7. Provide relevant knowledge base links
8. Set expectations for follow-up if needed
9. Determine if escalation is required
10. Close with a satisfaction check

**Output Format:**
- Issue Summary
- Root Cause Analysis
- Step-by-Step Solution
- Verification Steps
- Preventive Measures
- Knowledge Base References
- Escalation Recommendation (if needed)
- Customer Response Template
- Follow-up Plan
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'support',
      issueSummary: this.extractSection(response, 'Issue Summary'),
      rootCause: this.extractSection(response, 'Root Cause'),
      solution: this.extractSteps(response, 'Solution'),
      verification: this.extractSteps(response, 'Verification'),
      preventiveMeasures: this.extractList(response, 'Preventive'),
      knowledgeBaseRefs: this.extractList(response, 'Knowledge Base'),
      needsEscalation: this.checkEscalation(response),
      customerResponse: this.extractSection(response, 'Customer Response'),
      followUp: this.extractSection(response, 'Follow-up'),
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractSteps(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n\d+\.\s*|\n-\s*|\n•\s*/)
      .filter(s => s.trim().length > 5)
      .map(s => s.trim());
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 5)
      .map(s => s.trim());
  }

  private checkEscalation(response: string): boolean {
    const section = this.extractSection(response, 'Escalation');
    const lower = section.toLowerCase();
    return lower.includes('yes') || lower.includes('required') || lower.includes('escalate');
  }
}