import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/analytics/tools/$toolName/rpm")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { ToolAnalyticsInterceptor } = await import(
          "@/backend/analytics/tools/ToolAnalyticsInterceptor.server"
        );
        const rpm = await ToolAnalyticsInterceptor.getCurrentRPM(params.toolName);
        return Response.json({ toolName: params.toolName, rpm });
      },
    },
  },
});