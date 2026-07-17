export class MemoryStore {
  private data: Record<string, string> = {};

  set(key: string, value: string) {
    this.data[key] = value;
  }

  get(key: string) {
    return this.data[key];
  }
}