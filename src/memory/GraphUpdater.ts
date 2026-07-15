import type { Entity } from "./types";

export class GraphUpdater {
  async update(userId: string, entities: Entity[]) {
    console.log("[GraphUpdater] update", userId, entities);
  }
}