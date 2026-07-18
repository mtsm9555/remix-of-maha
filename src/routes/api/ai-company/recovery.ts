import { createFileRoute } from "@tanstack/react-router";
import { recoveryQueue } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/recovery")({
  server: {
    handlers: {
      GET: () => Response.json(recoveryQueue.getAllJobs()),
    },
  },
});