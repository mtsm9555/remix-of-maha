import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/backup/scheduler/tick")({
  server: {
    handlers: {
      POST: async () => {
        const { BackupScheduler } = await import("@/backend/infrastructure/backup/BackupScheduler.server");
        return Response.json({ executed: await BackupScheduler.tickPolicies() });
      },
    },
  },
});