import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/snapshots/diff")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const { isAdmin } = await import("@/backend/data/shared/sharedAuth.server");
        if (!(await isAdmin(userId))) {
          return new Response("Forbidden", { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const a = typeof body?.snapshotIdA === "string" ? body.snapshotIdA : "";
        const b = typeof body?.snapshotIdB === "string" ? body.snapshotIdB : "";
        if (!a || !b) {
          return Response.json(
            { error: "snapshotIdA and snapshotIdB required" },
            { status: 400 },
          );
        }
        const { SnapshotDiffEngine } = await import(
          "@/backend/data/snapshots/SnapshotDiffEngine.server"
        );
        try {
          const diff = await SnapshotDiffEngine.diffSnapshots(a, b);
          return Response.json({ diff });
        } catch (err) {
          const message = err instanceof Error ? err.message : "diff failed";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});