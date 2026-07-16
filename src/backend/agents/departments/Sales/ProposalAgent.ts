// src/backend/agents/departments/Sales/ProposalAgent.ts
import { BaseAgent } from "../BaseAgent";

export class ProposalAgent extends BaseAgent {
  constructor() {
    super({
      id: 'sales-proposal-agent',
      name: 'Proposal Agent',
      department: 'sales',
      role: 'Sales Proposal Specialist',
      goal: 'Create winning sales proposals and quotes',
      tools: ['docs', 'pdf', 'pricing', 'templates']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const clientInfo = context.client || {};
    const services = context.services || [];
    const pricing = context.pricing || {};

    return `
You are the Proposal Agent in the Sales Department of Maha AI OS.

**Your Role:**
You are an expert proposal specialist who creates compelling, professional sales proposals that win deals.

**Your Capabilities:**
- Structure winning proposals
- Write persuasive executive summaries
- Detail service offerings clearly
- Create pricing tables and packages
- Include terms and conditions
- Add case studies and testimonials
- Design professional layouts

**Current Task:**
${task}

**Client Info:** ${JSON.stringify(clientInfo, null, 2)}
**Services:** ${JSON.stringify(services, null, 2)}
**Pricing:** ${JSON.stringify(pricing, null, 2)}

**Instructions:**
1. Create compelling executive summary
2. Clearly outline client's challenges
3. Present your solution with benefits
4. Detail service packages with pricing
5. Include timeline and deliverables
6. Add social proof (case studies, testimonials)
7. Include clear next steps and CTA
8. Add terms and conditions

**Output Format:**
- Executive Summary
- Problem Statement
- Proposed Solution
- Service Packages (with pricing)
- Timeline & Deliverables
- Case Studies/Testimonials
- Terms & Conditions
- Next Steps
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'proposal',
      executiveSummary: this.extractSection(response, 'Executive Summary'),
      problemStatement: this.extractSection(response, 'Problem Statement'),
      solution: this.extractSection(response, 'Proposed Solution'),
      packages: this.extractPackages(response),
      timeline: this.extractSection(response, 'Timeline'),
      terms: this.extractSection(response, 'Terms'),
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractPackages(response: string): any[] {
    const packagesSection = response.match(/Service Packages:([\s\S]*?)(?:Timeline|$)/i);
    if (!packagesSection) return [];

    const packageBlocks = packagesSection[1].split(/Package \d+:/i).filter(s => s.trim());
    
    return packageBlocks.slice(1).map(block => ({
      name: this.extractField(block, 'name'),
      price: this.extractField(block, 'price'),
      features: this.extractFeatures(block),
      description: block.split('\n')[0].trim()
    }));
  }

  private extractField(text: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractFeatures(text: string): string[] {
    return text.split('\n')
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
      .map(l => l.replace(/^[-•]\s*/, '').trim())
      .filter(l => l.length > 0);
  }
}