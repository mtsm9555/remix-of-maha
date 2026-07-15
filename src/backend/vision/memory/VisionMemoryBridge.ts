interface MemoryLike {
  store(userId: string, content: string): Promise<unknown>;
}

export class VisionMemoryBridge {
  constructor(private memory: MemoryLike) {}

  async store(userId: string, result: unknown) {
    return this.memory.store(userId, JSON.stringify(result));
  }
}