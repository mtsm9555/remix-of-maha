import { create } from "zustand";

export interface Memory {
  id: string;
  content: string;
}

interface State {
  memories: Memory[];
  addMemory: (content: string) => void;
}

export const useMemoryStore = create<State>((set) => ({
  memories: [],
  addMemory: (content) =>
    set((state) => ({
      memories: [
        ...state.memories,
        { id: crypto.randomUUID(), content },
      ],
    })),
}));
