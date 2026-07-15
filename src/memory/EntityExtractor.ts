import type { Entity } from "./types";

// TODO: replace with GLiNER / spaCy
export class EntityExtractor {
  async extract(text: string): Promise<Entity[]> {
    const words = text.split(/\s+/).filter(Boolean);
    return words
      .filter((w) => w[0] && w[0] === w[0].toUpperCase())
      .map((name) => ({ name, type: "entity" }));
  }
}