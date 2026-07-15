import type { Relationship } from "./types";

export class GraphExpansion {
  expand(entityId: string, relationships: Relationship[]): Relationship[] {
    return relationships.filter(
      (r) => r.sourceId === entityId || r.targetId === entityId,
    );
  }
}