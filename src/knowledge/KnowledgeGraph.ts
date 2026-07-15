import { EntityService } from "./EntityService";
import { RelationshipService } from "./RelationshipService";
import { GraphTraversal } from "./GraphTraversal";
import { GraphSearch } from "./GraphSearch";
import { GraphExpansion } from "./GraphExpansion";

export class KnowledgeGraph {
  public entities = new EntityService();
  public relationships = new RelationshipService();
  private traversal = new GraphTraversal();
  private searcher = new GraphSearch();
  private expander = new GraphExpansion();

  async createEntity(name: string, type: string) {
    return this.entities.create(name, type);
  }

  async createRelationship(sourceId: string, targetId: string, relationType: string) {
    return this.relationships.create(sourceId, targetId, relationType);
  }

  async getConnectedNodes(entityId: string) {
    const edges = await this.relationships.getAll();
    return this.traversal.traverse(entityId, edges, 3);
  }

  async search(query: string) {
    const all = await this.entities.getAll();
    return this.searcher.search(query, all);
  }

  async expand(entityId: string) {
    const edges = await this.relationships.getAll();
    return this.expander.expand(entityId, edges);
  }
}