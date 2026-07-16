import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({ toolName: z.string(), versionId: z.string() });

export const Route = createFileRoute("/api/public/tools/versioning/health-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SESSION_SECRET;
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const parsed = Body.safeParse(await request.json());
        if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
        const { UpdateManager } = await import(
          "@/backend/tools/versioning/UpdateManager.server"
        );
        const result = await UpdateManager.evaluateVersionHealth(
          parsed.data.toolName,
          parsed.data.versionId,
        );
        return Response.json(result);
      },
    },
  },
});