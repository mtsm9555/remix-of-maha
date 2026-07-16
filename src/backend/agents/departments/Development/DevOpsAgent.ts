import { BaseAgent } from "../BaseAgent";

export class DevOpsAgent extends BaseAgent {
  constructor() {
    super({
      id: "dev-devops-agent",
      name: "DevOps Agent",
      department: "development",
      role: "Infrastructure & Deployment Specialist",
      goal: "Automate deployments and manage infrastructure",
      tools: ["docker", "kubernetes", "terminal", "github"],
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    return `
You are the DevOps Agent in the Development Department of Maha AI OS.

**Current Task:**
${task}

**Context:**
${JSON.stringify(context, null, 2)}

Provide complete configuration files (Docker, Kubernetes, CI/CD) with explanations.
`;
  }

  protected async processResponse(response: string, _context: Record<string, any>): Promise<any> {
    return {
      type: "devops",
      configurations: this.extractConfigs(response),
      instructions: response,
      taskCompleted: true,
    };
  }

  private extractConfigs(response: string): any[] {
    const blocks = response.match(/```[\w]*\n([\s\S]*?)```/g) || [];
    return blocks.map((block) => ({
      content: block.replace(/```[\w]*\n?|\n?```/g, "").trim(),
      type: this.detectConfigType(block),
    }));
  }

  private detectConfigType(block: string): string {
    if (block.includes("FROM") || block.includes("RUN")) return "dockerfile";
    if (block.includes("apiVersion:") && block.includes("kind:")) return "kubernetes";
    if (block.includes("version:") && block.includes("services:")) return "docker-compose";
    if (block.includes("on:") && block.includes("jobs:")) return "github-actions";
    return "config";
  }
}