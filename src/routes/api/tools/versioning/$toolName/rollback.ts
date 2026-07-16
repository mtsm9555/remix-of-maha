import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({ versionId: z.string().min(1) });

export const Route = createFileRoute("/api/tools/versioning/$toolName/rollback")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const parsed = Body.safeParse(await request.json());
        if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
        const { UpdateManager } = await import(
          "@/backend/tools/versioning/UpdateManager.server"
        );
        await UpdateManager.rollbackVersion(params.toolName, parsed.data.versionId);
        return Response.json({ success: true });
      },
    },
  },
});