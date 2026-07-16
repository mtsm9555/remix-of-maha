// src/backend/agents/departments/Design/UXAgent.ts
import { BaseAgent } from "../BaseAgent";

export class UXAgent extends BaseAgent {
  constructor() {
    super({
      id: 'design-ux-agent',
      name: 'UX Agent',
      department: 'design',
      role: 'User Experience Designer',
      goal: 'Design intuitive, user-centered experiences that solve real problems',
      tools: ['figma', 'user-research', 'analytics', 'prototyping']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const userPersona = context.persona || 'general user';
    const product = context.product || 'web application';
    const problem = context.problem || '';

    return `
You are the UX Agent in the Design Department of Maha AI OS.

**Your Role:**
You are an expert UX designer who creates intuitive, user-centered experiences through research, empathy, and iterative design.

**Your Capabilities:**
- Conduct user research analysis
- Create user personas and journey maps
- Design user flows and information architecture
- Create wireframes and low-fidelity prototypes
- Perform heuristic evaluations
- Design usability testing plans
- Optimize conversion funnels
- Apply UX psychology principles

**Current Task:**
${task}

**Target User:** ${userPersona}
**Product:** ${product}
**Problem Statement:** ${problem}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Understand the user's needs and pain points
2. Map out the user journey
3. Identify key decision points and friction
4. Design optimal user flows
5. Create wireframe descriptions
6. Apply UX best practices
7. Suggest usability testing approach
8. Provide metrics for success

**Output Format:**
- User Persona Summary
- User Journey Map
- User Flow Diagram (text-based)
- Information Architecture
- Wireframe Descriptions
- UX Recommendations
- Usability Testing Plan
- Success Metrics
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'ux_design',
      persona: this.extractSection(response, 'User Persona'),
      journey: this.extractSection(response, 'User Journey'),
      userFlow: this.extractSection(response, 'User Flow'),
      informationArchitecture: this.extractSection(response, 'Information Architecture'),
      wireframes: this.extractSection(response, 'Wireframe'),
      recommendations: this.extractRecommendations(response),
      testingPlan: this.extractSection(response, 'Usability Testing'),
      metrics: this.extractMetrics(response),
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractRecommendations(response: string): string[] {
    const section = this.extractSection(response, 'UX Recommendations');
    return section.split('\n')
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^[-•\d.]+\s*/, '').trim())
      .filter(l => l.length > 0)
      .slice(0, 10);
  }

  private extractMetrics(response: string): string[] {
    const section = this.extractSection(response, 'Success Metrics');
    return section.split('\n')
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
      .map(l => l.replace(/^[-•]\s*/, '').trim())
      .filter(l => l.length > 0);
  }
}