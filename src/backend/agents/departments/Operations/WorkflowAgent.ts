// src/backend/agents/departments/Operations/WorkflowAgent.ts
import { BaseAgent } from "../BaseAgent";

export class WorkflowAgent extends BaseAgent {
  constructor() {
    super({
      id: 'ops-workflow-agent',
      name: 'Workflow Agent',
      department: 'operations',
      role: 'Workflow Designer & Optimizer',
      goal: 'Design, optimize, and manage efficient business workflows',
      tools: ['workflow-engine', 'process-mining', 'analytics', 'documentation']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const workflowType = context.workflowType || 'business-process';
    const currentProcess = context.currentProcess || '';
    const painPoints = context.painPoints || [];

    return `
You are the Workflow Agent in the Operations Department of Maha AI OS.

**Your Role:**
You are an expert workflow designer and process optimization specialist who creates efficient, scalable, and automated business workflows.

**Your Capabilities:**
- Design end-to-end business workflows
- Identify bottlenecks and inefficiencies
- Create workflow diagrams and documentation
- Optimize existing processes for speed and quality
- Design approval chains and escalation paths
- Create SLAs and KPIs for workflow performance
- Integrate workflows with automation tools
- Design error handling and retry logic

**Current Task:**
${task}

**Workflow Type:** ${workflowType}
**Current Process:** ${currentProcess}
**Pain Points:** ${painPoints.join(', ')}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Analyze the current process (if provided)
2. Identify inefficiencies and bottlenecks
3. Design an optimized workflow
4. Define clear steps with owners and timelines
5. Include decision points and branching logic
6. Add error handling and fallback paths
7. Define KPIs and success metrics
8. Suggest automation opportunities
9. Create workflow documentation

**Output Format:**
- Workflow Overview
- Step-by-Step Process (with owners, timelines)
- Decision Points & Branching Logic
- Bottlenecks Identified
- Optimization Recommendations
- Automation Opportunities
- KPIs & Success Metrics
- Error Handling Strategy
- Workflow Diagram (text-based)
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'workflow',
      overview: this.extractSection(response, 'Workflow Overview'),
      steps: this.extractSteps(response),
      decisionPoints: this.extractDecisionPoints(response),
      bottlenecks: this.extractList(response, 'Bottlenecks'),
      optimizations: this.extractList(response, 'Optimization'),
      automationOpportunities: this.extractList(response, 'Automation'),
      kpis: this.extractList(response, 'KPIs'),
      errorHandling: this.extractSection(response, 'Error Handling'),
      diagram: this.extractSection(response, 'Workflow Diagram'),
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractSteps(response: string): any[] {
    const section = this.extractSection(response, 'Step-by-Step');
    const stepBlocks = section.split(/Step\s*\d+[:\.]?/i).filter(s => s.trim());
    
    return stepBlocks.slice(1).map((block, i) => ({
      stepNumber: i + 1,
      description: block.split('\n')[0].trim(),
      owner: this.extractField(block, 'owner|responsible'),
      duration: this.extractField(block, 'duration|time'),
      dependencies: this.extractField(block, 'dependencies')
    }));
  }

  private extractDecisionPoints(response: string): string[] {
    return this.extractList(response, 'Decision Points');
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split('\n')
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || /^\d+\./.test(l.trim()))
      .map(l => l.replace(/^[-•\d.]+\s*/, '').trim())
      .filter(l => l.length > 0);
  }

  private extractField(text: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
}