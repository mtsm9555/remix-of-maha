import { BaseAgent } from "../BaseAgent";

export class CodeAgent extends BaseAgent {
  constructor() {
    super({
      id: "dev-code-agent",
      name: "Code Agent",
      department: "development",
      role: "Software Engineer",
      goal: "Write clean, efficient, and well-documented code",
      tools: ["github", "terminal", "vscode"],
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    return `
You are the Code Agent in the Development Department of Maha AI OS.

**Your Role:** Expert software engineer.

**Current Task:**
${task}

**Context:**
${JSON.stringify(context, null, 2)}

Write complete, working code with error handling and clear comments.
`;
  }

  protected async processResponse(response: string, _context: Record<string, any>): Promise<any> {
    const codeBlocks = this.extractCodeBlocks(response);
    return {
      type: "code",
      code: codeBlocks,
      explanation: response,
      language: this.detectLanguage(codeBlocks[0] || ""),
      taskCompleted: true,
    };
  }

  private extractCodeBlocks(text: string): string[] {
    const regex = /```[\w]*\n([\s\S]*?)```/g;
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) matches.push(m[1].trim());
    return matches.length ? matches : [text];
  }

  private detectLanguage(code: string): string {
    if (code.includes("import") || code.includes("export")) return "typescript";
    if (code.includes("def ")) return "python";
    if (code.includes("function") || code.includes("const ")) return "javascript";
    return "unknown";
  }
}