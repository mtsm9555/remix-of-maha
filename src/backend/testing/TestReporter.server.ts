import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { TestReport } from "./TestingFrameworkTypes";

export class TestReporter {
  static async generateReport(
    runId: string,
    tenantId: string,
    format: 'json' | 'html' | 'junit' = 'json',
  ): Promise<TestReport> {
    const { data: run } = await supabaseAdmin
      .from('test_runs')
      .select('*')
      .eq('id', runId)
      .eq('tenant_id', tenantId)
      .single();
    if (!run) throw new Error('Test run not found');

    const { data: suite } = await supabaseAdmin
      .from('test_suites')
      .select('*')
      .eq('id', (run as any).suite_id)
      .single();

    const results: any[] = ((run as any).results as any[]) || [];
    const totalTests = (run as any).total_tests as number;
    const passedTests = (run as any).passed_tests as number;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const averageDuration =
      results.length > 0
        ? results.reduce((s, r) => s + (r.durationMs || r.duration_ms || 0), 0) / results.length
        : 0;

    const byType: Record<string, { passed: number; failed: number; total: number }> = {};
    if (suite) {
      byType[(suite as any).type] = {
        passed: passedTests,
        failed: (run as any).failed_tests,
        total: totalTests,
      };
    }

    const failedTests = results
      .filter((r) => r.status === 'failed' || r.status === 'error')
      .map((r) => ({
        suiteName: (suite as any)?.name ?? '',
        testName: r.testCaseId || r.test_case_id,
        error: r.error || 'Assertion failed',
      }));

    const slowestTests = [...results]
      .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))
      .slice(0, 10)
      .map((r) => ({ testName: r.testCaseId || r.test_case_id, durationMs: r.durationMs || 0 }));

    const report: TestReport = {
      id: `report_${crypto.randomUUID()}`,
      runId,
      tenantId,
      summary: { totalSuites: 1, totalTests, passRate, averageDuration },
      byType,
      byPriority: {},
      failedTests,
      slowestTests,
      format,
      generatedAt: new Date(),
    };

    await supabaseAdmin.from('test_reports').insert({
      id: report.id,
      run_id: report.runId,
      tenant_id: report.tenantId,
      summary: report.summary as any,
      by_type: report.byType as any,
      by_priority: report.byPriority as any,
      failed_tests: report.failedTests as any,
      slowest_tests: report.slowestTests as any,
      format: report.format,
      generated_at: report.generatedAt.toISOString(),
    });

    return report;
  }

  static exportAsJUnit(report: TestReport): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n  <testsuite name="Maha OS Tests" tests="${report.summary.totalTests}" failures="${report.failedTests.length}">\n`;
    for (const t of report.failedTests) {
      xml += `    <testcase name="${t.testName}"><failure message="${t.error}">${t.error}</failure></testcase>\n`;
    }
    xml += `  </testsuite>\n</testsuites>`;
    return xml;
  }

  static exportAsHTML(report: TestReport): string {
    const rows = report.failedTests
      .map((t) => `<tr><td>${t.suiteName}</td><td>${t.testName}</td><td>${t.error}</td></tr>`)
      .join('');
    const slow = report.slowestTests
      .map((t) => `<tr><td>${t.testName}</td><td>${t.durationMs}</td></tr>`)
      .join('');
    return `<!DOCTYPE html><html><head><title>Test Report</title></head><body>
<h1>Test Report</h1>
<p>Total: ${report.summary.totalTests} | Pass rate: ${report.summary.passRate.toFixed(2)}% | Avg: ${report.summary.averageDuration.toFixed(2)}ms</p>
<h2>Failed</h2><table border="1"><tr><th>Suite</th><th>Test</th><th>Error</th></tr>${rows}</table>
<h2>Slowest</h2><table border="1"><tr><th>Test</th><th>Duration (ms)</th></tr>${slow}</table>
</body></html>`;
  }
}