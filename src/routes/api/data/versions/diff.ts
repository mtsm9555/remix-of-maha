import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/data/versions/diff")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authUserFromRequest } = await import(
          "@/backend/data/user/routeAuth.server"
        );
        const userId = await authUserFromRequest(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as {
          versionIdA?: string;
          versionIdB?: string;
        };
        if (!body.versionIdA || !body.versionIdB) {
          return Response.json(
            { error: "versionIdA and versionIdB are required" },
            { status: 400 },
          );
        }

        try {
          const { VersionDiffEngine } = await import(
            "@/backend/data/versioning/VersionDiffEngine.server"
          );
          const diff = await VersionDiffEngine.diffVersions(
            body.versionIdA,
            body.versionIdB,
          );
          return Response.json({ diff });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Diff failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});