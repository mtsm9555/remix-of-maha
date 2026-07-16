import { osGenerate } from "../../os/llm";

export class CompressionAlgorithms {
  static async summarizeText(text: string, maxTokens: number): Promise<string> {
    const prompt = `Summarize the following text into a dense, highly informative paragraph.
Retain all critical facts, numbers, and technical details. Remove fluff and repetition.
Target length: approximately ${maxTokens * 4} characters.

**Text to Compress:**
${text}`;
    const response = await osGenerate(prompt);
    return response.content;
  }

  static async extractDecisions(text: string): Promise<string> {
    const prompt = `Analyze the following text and extract ONLY:
1. Key Decisions Made
2. Action Items (who is doing what)
3. Critical Constraints or Deadlines

**Text to Analyze:**
${text}

**Output Format:**
- **Decisions:** [List]
- **Actions:** [List]
- **Constraints:** [List]`;
    const response = await osGenerate(prompt);
    return response.content;
  }

  static async extractEntities(text: string): Promise<string> {
    const prompt = `Extract only the named entities (people, organizations, places, technical terms, systems) from the text below, as a comma-separated list.

**Text:**
${text}`;
    const response = await osGenerate(prompt);
    return response.content;
  }

  static async distillConversation(messages: { role: string; content: string }[]): Promise<string> {
    const formattedChat = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
    const prompt = `Convert the following chat history into a concise, third-person narrative summary.
Focus on the evolution of the user's request, the agent's findings, and the final outcome.

**Chat History:**
${formattedChat}

**Narrative Summary:**`;
    const response = await osGenerate(prompt);
    return response.content;
  }

  static compressCode(code: string): string {
    let compressed = code.replace(/\/\*[\s\S]*?\*\//g, "");
    compressed = compressed.replace(/\/\/.*$/gm, "");
    compressed = compressed.replace(/\n\s*\n/g, "\n");
    return compressed.trim();
  }
}
