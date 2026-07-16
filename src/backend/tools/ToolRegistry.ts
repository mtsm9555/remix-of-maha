// src/backend/tools/ToolRegistry.ts
import { ToolDefinition } from "./types";

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  search(query: string): ToolDefinition[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }

  count(): number {
    return this.tools.size;
  }

  clear(): void {
    this.tools.clear();
  }

  // Formats tools for LLM Planner Agent function-calling
  getLLMToolSpecs() {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }
}

export const globalToolRegistry = new ToolRegistry();
export const toolRegistry = globalToolRegistry;
