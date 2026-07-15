import { MemoryEngine } from "./MemoryEngine";
import { MemoryService } from "./MemoryService";
import { MemoryRetriever } from "./MemoryRetriever";
import { EntityExtractor } from "./EntityExtractor";
import { GraphUpdater } from "./GraphUpdater";

export const memoryEngine = new MemoryEngine(
  new MemoryService(),
  new MemoryRetriever(),
  new EntityExtractor(),
  new GraphUpdater(),
);

export * from "./types";