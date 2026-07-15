import { MemoryRetriever } from "./MemoryRetriever";
import { MemoryService } from "./MemoryService";
import { EntityExtractor } from "./EntityExtractor";
import { GraphUpdater } from "./GraphUpdater";

export class MemoryEngine {
  constructor(
    private memoryService: MemoryService,
    private retriever: MemoryRetriever,
    private entityExtractor: EntityExtractor,
    private graphUpdater: GraphUpdater,
  ) {}

  async store(userId: string, content: string) {
    const entities = await this.entityExtractor.extract(content);
    const memory = await this.memoryService.createMemory(userId, content);
    this.retriever.register(memory);
    await this.graphUpdater.update(userId, entities);
    return memory;
  }

  async retrieve(userId: string, query: string) {
    return this.retriever.search(userId, query);
  }
}