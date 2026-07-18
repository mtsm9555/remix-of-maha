import { createFileRoute } from "@tanstack/react-router";
import { memoryStore } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/memory")({
  server: {
    handlers: {
      GET: () => Response.json(memoryStore.getAllMemories()),
    },
  },
});