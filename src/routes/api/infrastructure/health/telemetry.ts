import { createFileRoute } from "@tanstack/react-router";
import { TelemetryCollector } from "@/backend/infrastructure/health/TelemetryCollector";
import type { HealthTelemetry } from "@/backend/infrastructure/health/HealthTypes";

export const Route = createFileRoute("/api/infrastructure/health/telemetry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Omit<HealthTelemetry, "timestamp">;
        if (!body?.instanceId) {
          return new Response(JSON.stringify({ error: "instanceId required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        await TelemetryCollector.recordSample(body);
        return Response.json({ success: true });
      },
    },
  },
});