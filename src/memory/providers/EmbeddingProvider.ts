// TODO: replace with nomic-embed / bge-large / gte-large
export class EmbeddingProvider {
  async embed(_text: string): Promise<number[]> {
    return Array.from({ length: 1024 }, () => Math.random());
  }
}