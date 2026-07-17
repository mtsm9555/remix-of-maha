import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TestReporter } from "@/backend/testing/TestReporter.server";
import type { TestReport } from "@/backend/testing/TestingFrameworkTypes";

export const Route = createFileRoute("/api/testing/$tenantId/reports/$reportId/export")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data, error } = await supabaseAdmin
          .from("test_reports")
          .select("*")
          .eq("id", params.reportId)
          .eq("tenant_id", params.tenantId)
          .single();
        if (error || !data) return new Response("Not found", { status: 404 });

        const row: any = data;
        const report: TestReport = {
          id: row.id,
          runId: row.run_id,
          tenantId: row.tenant_id,
          summary: row.summary,
          byType: row.by_type || {},
          byPriority: row.by_priority || {},
          failedTests: row.failed_tests || [],
          slowestTests: row.slowest_tests || [],
          format: row.format,
          fileUrl: row.file_url,
          generatedAt: new Date(row.generated_at),
        };

        let content: string;
        let contentType: string;
        let filename: string;
        switch (report.format) {
          case "html":
            content = TestReporter.exportAsHTML(report);
            contentType = "text/html";
            filename = "test-report.html";
            break;
          case "junit":
            content = TestReporter.exportAsJUnit(report);
            contentType = "application/xml";
            filename = "test-report.xml";
            break;
          default:
            content = JSON.stringify(report, null, 2);
            contentType = "application/json";
            filename = "test-report.json";
        }
        return new Response(content, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      },
    },
  },
});