import { BaseAgent } from "../BaseAgent";

export class DebugAgent extends BaseAgent {
  constructor() {
    super({
      id: "dev-debug-agent",
      name: "Debug Agent",
      department: "development",
      role: "Debugging Specialist",
      goal: "Identify and fix bugs quickly and accurately",
      tools: ["terminal", "logs", "github"],
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    return `
You are the Debug Agent in the Development Department of Maha AI OS.

**Current Task:**
${task}

**Context:**
${JSON.stringify(context, null, 2)}

Respond with:
- Root Cause: ...
- Fix: ...
- Prevention: ...
`;
  }

  protected async processResponse(response: string, _context: Record<string, any>): Promise<any> {
    return {
      type: "debug",
      analysis: response,
      fix: this.extractFix(response),
      rootCause: this.extractRootCause(response),
      taskCompleted: true,
    };
  }

  private extractFix(response: string): string {
    const m = response.match(/Fix:([\s\S]*?)(?:Prevention:|$)/i);
    return m ? m[1].trim() : response;
  }

  private extractRootCause(response: string): string {
    const m = response.match(/Root Cause:([\s\S]*?)Fix:/i);
    return m ? m[1].trim() : "Unknown";
  }
}