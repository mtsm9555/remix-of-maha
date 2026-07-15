// src/backend/tools/ToolRegistry.ts
import { BaseTool, ToolSchema } from "./types";
import { Logger } from "../observability/Logger";

export class ToolRegistry {
  private tools = new Map<string, BaseTool>();
  private schemas = new Map<string, ToolSchema>();
  private logger = new Logger();

  register(tool: BaseTool): void {
    const name = tool.schema.name;
    if (this.tools.has(name)) {
      this.logger.warn(`Tool ${name} already registered. Overwriting.`, { tool: name });
    }
    this.tools.set(name, tool);
    this.schemas.set(name, tool.schema);
    this.logger.info(`Tool registered: ${name}`, { category: tool.schema.category, risk: tool.schema.risk });
  }

  unregister(name: string): boolean {
    const existed = this.tools.delete(name);
    this.schemas.delete(name);
    if (existed) {
      this.logger.info(`Tool unregistered: ${name}`);
    }
    return existed;
  }

  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getSchema(name: string): ToolSchema | undefined {
    return this.schemas.get(name);
  }

  list(): ToolSchema[] {
    return Array.from(this.schemas.values());
  }

  listByCategory(category: string): ToolSchema[] {
    return this.list().filter((s) => s.category === category);
  }

  search(query: string): ToolSchema[] {
    const q = query.toLowerCase();
    return this.list().filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }

  count(): number {
    return this.tools.size;
  }

  clear(): void {
    this.tools.clear();
    this.schemas.clear();
    this.logger.info("Tool registry cleared");
  }
}

export const toolRegistry = new ToolRegistry();
