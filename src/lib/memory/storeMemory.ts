// Lightweight in-browser memory store. Replace with backend persistence later.
const memoryLog: { text: string; at: number }[] = [];

export async function storeMemory(input: string) {
  const entry = { text: input, at: Date.now() };
  memoryLog.push(entry);
  try {
    if (typeof window !== "undefined") {
      const key = "maha:memory";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(entry);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch {}
  return { stored: true, entry, total: memoryLog.length };
}

export function listMemory() {
  return [...memoryLog];
}