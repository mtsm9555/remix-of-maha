// src/backend/agents/departments/Operations/AutomationAgent.ts
import { BaseAgent } from "../BaseAgent";

export class AutomationAgent extends BaseAgent {
  constructor() {
    super({
      id: 'ops-automation-agent',
      name: 'Automation Agent',
      department: 'operations',
      role: 'Automation Engineer & Browser Automation Specialist',
      goal: 'Automate repetitive tasks and browser-based workflows',
      tools: ['playwright', 'puppeteer', 'selenium', 'zapier', 'make', 'n8n', 'scripts']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const automationType = context.automationType || 'browser';
    const targetSystem = context.targetSystem || '';
    const frequency = context.frequency || 'on-demand';
    const trigger = context.trigger || 'manual';

    return `
You are the Automation Agent in the Operations Department of Maha AI OS.

**Your Role:**
You are an expert automation engineer who designs and implements robust, scalable automation solutions for repetitive tasks, browser workflows, and system integrations.

**Your Capabilities:**
- Write Playwright/Puppeteer scripts for browser automation
- Create API integration scripts
- Design automation workflows (Zapier, Make, n8n)
- Automate data extraction and processing
- Create scheduled task automation
- Build web scraping solutions
- Automate form filling and submissions
- Design error handling and retry logic
- Create automation monitoring and alerts

**Current Task:**
${task}

**Automation Type:** ${automationType}
**Target System:** ${targetSystem}
**Frequency:** ${frequency}
**Trigger:** ${trigger}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Analyze the automation requirements
2. Choose the best approach (browser, API, workflow tool)
3. Write production-ready automation code
4. Include comprehensive error handling
5. Add logging and monitoring
6. Implement retry logic for failures
7. Document the automation
8. Provide deployment instructions
9. Suggest monitoring and alerts

**Output Format:**
- Automation Overview
- Approach & Technology Choice
- Complete Automation Code
- Error Handling Strategy
- Configuration Requirements
- Deployment Instructions
- Monitoring & Alerts Setup
- Maintenance Notes
- Expected Performance Metrics
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'automation',
      overview: this.extractSection(response, 'Automation Overview'),
      approach: this.extractSection(response, 'Approach'),
      code: this.extractCode(response),
      errorHandling: this.extractSection(response, 'Error Handling'),
      configuration: this.extractSection(response, 'Configuration'),
      deployment: this.extractSection(response, 'Deployment'),
      monitoring: this.extractSection(response, 'Monitoring'),
      automationType: context.automationType || 'browser',
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractCode(response: string): string {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [];
    let match;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches.length > 0 ? matches.join('\n\n---\n\n') : '';
  }
}