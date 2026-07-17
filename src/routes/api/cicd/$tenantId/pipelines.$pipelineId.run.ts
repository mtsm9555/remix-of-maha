import { createFileRoute } from "@tanstack/react-router";
import { PipelineExecutor } from "@/backend/cicd/PipelineExecutor.server";

export const Route = createFileRoute("/api/cicd/$tenantId/pipelines/$pipelineId/run")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json().catch(() => ({} as Record<string, unknown>));
        const run = await PipelineExecutor.execute(
          params.pipelineId,
          params.tenantId,
          (body.triggeredBy as string) ?? "manual",
          (body.triggerType as string) ?? "manual",
          {
            commitHash: body.commitHash as string | undefined,
            commitMessage: body.commitMessage as string | undefined,
            branch: body.branch as string | undefined,
            tag: body.tag as string | undefined,
            variables: body.variables as Record<string, string> | undefined,
          },
        );
        return Response.json({ success: true, run });
      },
    },
  },
});