import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/backup/jobs/$id/execute")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const { BackupManager } = await import("@/backend/infrastructure/backup/BackupManager.server");
        return Response.json(await BackupManager.executeBackup(params.id));
      },
    },
  },
});