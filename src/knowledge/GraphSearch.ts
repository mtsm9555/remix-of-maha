import type { Entity } from "./types";

export class GraphSearch {
  search(query: string, entities: Entity[]): Entity[] {
    return entities.filter((e) =>
      e.name.toLowerCase().includes(query.toLowerCase()),
    );
  }
}