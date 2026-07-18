import { createFileRoute } from "@tanstack/react-router";
import { auditLog } from "@/ai-company/runtime/singletons";

export const Route = createFileRoute("/api/ai-company/audit")({
  server: {
    handlers: {
      GET: () => Response.json(auditLog.getAllEvents()),
    },
  },
});