import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/backup/restore")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as {
          tenantId: string; backupId: string; overwriteExisting?: boolean;
        };
        const { RestoreEngine } = await import("@/backend/infrastructure/backup/RestoreEngine.server");
        const job = await RestoreEngine.createRestoreJob(body.tenantId, body.backupId, {
          overwriteExisting: body.overwriteExisting,
        });
        const result = await RestoreEngine.executeRestore(job.id);
        return Response.json({ ...job, ...result });
      },
    },
  },
});