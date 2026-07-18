import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai-company/health")({
  server: {
    handlers: {
      GET: () => Response.json({ ok: true, service: "ai-company-api" }),
    },
  },
});