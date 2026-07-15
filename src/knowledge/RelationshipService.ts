import type { Relationship } from "./types";

export class RelationshipService {
  private relationships = new Map<string, Relationship>();

  async create(
    sourceId: string,
    targetId: string,
    relationType: string,
    confidence = 1,
  ): Promise<Relationship> {
    const relation: Relationship = {
      id: crypto.randomUUID(),
      sourceId,
      targetId,
      relationType,
      confidence,
      createdAt: new Date(),
    };
    this.relationships.set(relation.id, relation);
    return relation;
  }

  async getAll(): Promise<Relationship[]> {
    return Array.from(this.relationships.values());
  }
}