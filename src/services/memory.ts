export interface MemoryItem {
  id: string;
  content: string;
  timestamp: number;
  type: "conversation" | "vision" | "task";
}

const STORAGE_KEY = "maha_memories";

export class MemoryService {
  getAll(): MemoryItem[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as MemoryItem[];
    } catch {
      return [];
    }
  }

  save(memory: MemoryItem) {
    if (typeof window === "undefined") return;
    const existing = this.getAll();
    existing.unshift(memory);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }

  remove(id: string) {
    if (typeof window === "undefined") return;
    const memories = this.getAll().filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  }

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const memoryService = new MemoryService();