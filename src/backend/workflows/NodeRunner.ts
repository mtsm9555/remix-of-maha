// src/backend/workflows/NodeRunner.ts
import type { WorkflowNode, WorkflowContext } from "./types";

export class NodeRunner {
  static async run(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    console.log(`[NodeRunner] Executing node: ${node.name} (${node.type})`);

    switch (node.type) {
      case 'tool_call':
        return await this.executeToolCall(node, context);
      case 'llm_prompt':
        return await this.executeLLMPrompt(node, context);
      case 'memory_save':
        return await this.executeMemorySave(node, context);
      case 'agent_task':
        return await this.executeAgentTask(node, context);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private static async executeToolCall(node: WorkflowNode, context: WorkflowContext) {
    const { toolName, argsTemplate } = node.config;
    const resolvedArgs = this.resolveTemplate(argsTemplate, context);
    return { success: true, data: `Mock result from ${toolName}`, args: resolvedArgs };
  }

  private static async executeLLMPrompt(node: WorkflowNode, context: WorkflowContext) {
    const { promptTemplate } = node.config;
    const resolvedPrompt = this.resolveTemplate(promptTemplate, context);
    return `Mock LLM response based on: ${String(resolvedPrompt).substring(0, 50)}...`;
  }

  private static async executeMemorySave(node: WorkflowNode, context: WorkflowContext) {
    const { dataKey } = node.config;
    const dataToSave = context.nodeOutputs[dataKey];
    console.log(`[NodeRunner] Saving to memory:`, dataToSave);
    return { saved: true };
  }

  private static async executeAgentTask(node: WorkflowNode, _context: WorkflowContext) {
    const { agentName, taskDescription } = node.config;
    return `Mock output from ${agentName} completing task: ${taskDescription}`;
  }

  private static resolveTemplate(template: any, context: WorkflowContext): any {
    if (typeof template === 'string') {
      return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const value = this.getNestedValue(context, key.trim());
        return value !== undefined ? String(value) : match;
      });
    }
    if (Array.isArray(template)) {
      return template.map((item) => this.resolveTemplate(item, context));
    }
    if (typeof template === 'object' && template !== null) {
      const resolved: any = {};
      for (const [k, v] of Object.entries(template)) {
        resolved[k] = this.resolveTemplate(v, context);
      }
      return resolved;
    }
    return template;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc: any, part: string) => acc?.[part], obj);
  }
}