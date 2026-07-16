import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/tools/versioning/sweep")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SESSION_SECRET;
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { DeprecationSweeper } = await import(
          "@/backend/tools/versioning/DeprecationSweeper.server"
        );
        const result = await DeprecationSweeper.runLifecycleChecks();
        return Response.json(result);
      },
    },
  },
});