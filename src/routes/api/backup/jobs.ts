import { createFileRoute } from "@tanstack/react-router";
import type { BackupType, BackupTarget, BackupStorage } from "@/backend/infrastructure/backup/BackupSystemTypes";

export const Route = createFileRoute("/api/backup/jobs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tenantId = url.searchParams.get("tenantId");
        if (!tenantId) return new Response("tenantId required", { status: 400 });
        const { BackupManager } = await import("@/backend/infrastructure/backup/BackupManager.server");
        return Response.json(await BackupManager.listJobs(tenantId));
      },
      POST: async ({ request }) => {
        const body = await request.json() as {
          tenantId: string;
          type: BackupType;
          target: BackupTarget;
          storage: BackupStorage;
          includeTables?: string[];
          retentionDays?: number;
        };
        const { BackupManager } = await import("@/backend/infrastructure/backup/BackupManager.server");
        const job = await BackupManager.createBackupJob(
          body.tenantId, body.type, body.target, body.storage,
          { includeTables: body.includeTables, retentionDays: body.retentionDays }
        );
        return Response.json(job, { status: 201 });
      },
    },
  },
});