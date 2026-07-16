import { createFileRoute } from "@tanstack/react-router";
import { SandboxOrchestrator } from "@/backend/tools/sandbox/SandboxOrchestrator.server";

export const Route = createFileRoute("/api/infrastructure/sandbox/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          payload?: string;
          allowedDomains?: string[];
          network?: boolean;
        };
        const payload =
          body.payload ??
          `console.log("sandbox test ok"); return { ok: true };`;
        const result = await SandboxOrchestrator.executeSandboxedTool(
          "sandbox_test",
          "0.0.0",
          payload,
          {},
          { agentId: "admin-test" },
          {
            requestedPermissions: body.network ? ["network_access"] : [],
            allowedDomains: body.allowedDomains ?? [],
          },
        );
        return Response.json({ result });
      },
    },
  },
});