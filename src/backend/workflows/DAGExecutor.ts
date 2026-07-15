// src/backend/workflows/DAGExecutor.ts
import type { WorkflowDefinition, WorkflowContext } from "./types";
import { NodeRunner } from "./NodeRunner";

export class DAGExecutor {
  static async execute(workflow: WorkflowDefinition, context: WorkflowContext): Promise<void> {
    const { nodes, edges } = workflow;

    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      dependents.set(node.id, []);
    }

    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      dependents.get(edge.source)!.push(edge.target);
    }

    const nodePromises = new Map<string, Promise<void>>();

    const executeNode = async (nodeId: string): Promise<void> => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) throw new Error(`Node ${nodeId} not found`);

      const parentIds = edges.filter((e) => e.target === nodeId).map((e) => e.source);
      if (parentIds.length > 0) {
        await Promise.all(parentIds.map((pid) => nodePromises.get(pid)));
      }

      try {
        const output = await NodeRunner.run(node, context);
        context.nodeOutputs[nodeId] = output;
      } catch (error: any) {
        throw new Error(`Node ${node.name} failed: ${error.message}`);
      }

      const children = dependents.get(nodeId) || [];
      for (const childId of children) {
        if (!nodePromises.has(childId)) {
          nodePromises.set(childId, executeNode(childId));
        }
      }
    };

    const rootNodes = nodes.filter((n) => inDegree.get(n.id) === 0);
    for (const root of rootNodes) {
      nodePromises.set(root.id, executeNode(root.id));
    }

    // Wait until all nodes have been scheduled and resolved
    let pending = Array.from(nodePromises.values());
    while (pending.length > 0) {
      await Promise.all(pending);
      pending = Array.from(nodePromises.values()).slice(pending.length);
    }
  }
}