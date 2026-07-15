import type { Relationship } from "./types";

export class GraphTraversal {
  traverse(startNode: string, relationships: Relationship[], depth = 2): string[] {
    const visited = new Set<string>();
    const queue: { node: string; level: number }[] = [{ node: startNode, level: 0 }];

    while (queue.length) {
      const current = queue.shift();
      if (!current) continue;
      if (current.level > depth) continue;

      visited.add(current.node);

      const connected = relationships.filter((r) => r.sourceId === current.node);
      for (const edge of connected) {
        if (!visited.has(edge.targetId)) {
          queue.push({ node: edge.targetId, level: current.level + 1 });
        }
      }
    }

    return [...visited];
  }
}