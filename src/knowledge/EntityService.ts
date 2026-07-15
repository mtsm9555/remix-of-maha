import type { Entity } from "./types";

export class EntityService {
  private entities = new Map<string, Entity>();

  async create(name: string, type: string): Promise<Entity> {
    const entity: Entity = {
      id: crypto.randomUUID(),
      name,
      type,
      createdAt: new Date(),
    };
    this.entities.set(entity.id, entity);
    return entity;
  }

  async get(id: string): Promise<Entity | undefined> {
    return this.entities.get(id);
  }

  async findByName(name: string) {
    return Array.from(this.entities.values()).filter((e) =>
      e.name.toLowerCase().includes(name.toLowerCase()),
    );
  }

  async getAll(): Promise<Entity[]> {
    return Array.from(this.entities.values());
  }
}