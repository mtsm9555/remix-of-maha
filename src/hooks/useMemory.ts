import { useEffect, useState, useCallback } from "react";
import { memoryService, type MemoryItem } from "@/services/memory";

export function useMemory() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  useEffect(() => {
    setMemories(memoryService.getAll());
  }, []);

  const addMemory = useCallback(
    (content: string, type: MemoryItem["type"] = "conversation") => {
      const item: MemoryItem = {
        id: crypto.randomUUID(),
        content,
        timestamp: Date.now(),
        type,
      };
      memoryService.save(item);
      setMemories(memoryService.getAll());
    },
    [],
  );

  const deleteMemory = useCallback((id: string) => {
    memoryService.remove(id);
    setMemories(memoryService.getAll());
  }, []);

  const clearMemory = useCallback(() => {
    memoryService.clear();
    setMemories([]);
  }, []);

  return { memories, addMemory, deleteMemory, clearMemory };
}