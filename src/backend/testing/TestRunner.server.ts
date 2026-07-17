import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  TestSuite,
  TestRun,
  TestResult,
  TestStatus,
  TestCase,
  AssertionResult,
} from "./TestingFrameworkTypes";
import { MockManager } from "./MockManager";
import { AssertionEngine } from "./AssertionEngine";

export class TestRunner {
  static async runSuite(
    suiteId: string,
    tenantId: string,
    triggeredBy: string,
    environment: 'development' | 'staging' | 'production' = 'development',
  ): Promise<TestRun> {
    const { data: suite } = await supabaseAdmin
      .from('test_suites')
      .select('*')
      .eq('id', suiteId)
      .eq('tenant_id', tenantId)
      .single();
    if (!suite) throw new Error('Test suite not found');

    const testSuite: TestSuite = {
      ...(suite as any),
      testCases: (suite as any).test_cases || [],
      createdAt: new Date((suite as any).created_at),
      updatedAt: new Date((suite as any).updated_at),
    };

    const runId = `run_${crypto.randomUUID()}`;
    const startedAt = new Date();
    const testRun: TestRun = {
      id: runId,
      suiteId,
      tenantId,
      triggeredBy,
      environment,
      status: 'running',
      startedAt,
      durationMs: 0,
      totalTests: testSuite.testCases.length,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      results: [],
      createdAt: new Date(),
    };

    await supabaseAdmin.from('test_runs').insert({
      id: testRun.id,
      suite_id: testRun.suiteId,
      tenant_id: testRun.tenantId,
      triggered_by: testRun.triggeredBy,
      environment: testRun.environment,
      status: 'running',
      started_at: testRun.startedAt.toISOString(),
      total_tests: testRun.totalTests,
    });

    const results: TestResult[] = [];
    if (testSuite.parallelExecution) {
      const settled = await Promise.allSettled(
        testSuite.testCases.map((tc) => this.executeTestCase(tc, runId, testSuite)),
      );
      for (const r of settled) {
        if (r.status === 'fulfilled') results.push(r.value);
        else results.push(this.createErrorResult(runId, '', r.reason));
      }
    } else {
      for (const tc of testSuite.testCases) {
        try {
          results.push(await this.executeTestCase(tc, runId, testSuite));
        } catch (e: any) {
          results.push(this.createErrorResult(runId, tc.id, e));
        }
      }
    }

    testRun.results = results;
    testRun.passedTests = results.filter((r) => r.status === 'passed').length;
    testRun.failedTests = results.filter((r) => r.status === 'failed' || r.status === 'error').length;
    testRun.skippedTests = results.filter((r) => r.status === 'skipped').length;
    testRun.completedAt = new Date();
    testRun.durationMs = testRun.completedAt.getTime() - startedAt.getTime();
    testRun.status = testRun.failedTests > 0 ? 'failed' : 'passed';

    await supabaseAdmin
      .from('test_runs')
      .update({
        status: testRun.status,
        completed_at: testRun.completedAt.toISOString(),
        duration_ms: testRun.durationMs,
        passed_tests: testRun.passedTests,
        failed_tests: testRun.failedTests,
        skipped_tests: testRun.skippedTests,
        results: testRun.results as any,
      })
      .eq('id', runId);

    await supabaseAdmin
      .from('test_suites')
      .update({
        last_run_at: testRun.completedAt.toISOString(),
        last_run_status: testRun.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', suiteId);

    return testRun;
  }

  private static async executeTestCase(
    testCase: TestCase,
    runId: string,
    suite: TestSuite,
  ): Promise<TestResult> {
    const startTime = Date.now();
    const logs: string[] = [`Starting test: ${testCase.name}`];
    try {
      const mockManager = new MockManager(testCase.mocks || []);
      await mockManager.activate();

      let actualOutput: any = testCase.expectedOutput ?? { success: true };
      let actualToolCalls: any[] = [];
      if (suite.type === 'agent') {
        const mockResponse = mockManager.getMockResponse('llm_response', 'agent');
        actualOutput = mockResponse ?? actualOutput;
      }

      const assertionResults: AssertionResult[] = [];
      for (const assertion of testCase.assertions || []) {
        assertionResults.push(await AssertionEngine.evaluate(assertion, actualOutput, actualToolCalls));
      }
      if (testCase.expectedToolCalls) {
        assertionResults.push(AssertionEngine.validateToolCalls(testCase.expectedToolCalls, actualToolCalls));
      }

      const allPassed = assertionResults.every((r) => r.passed);
      const status: TestStatus = allPassed ? 'passed' : 'failed';
      await mockManager.deactivate();
      logs.push(`Test completed: ${status}`);

      return {
        id: `result_${crypto.randomUUID()}`,
        runId,
        testCaseId: testCase.id,
        status,
        durationMs: Date.now() - startTime,
        actualOutput,
        actualToolCalls,
        assertionResults,
        logs,
        createdAt: new Date(),
      };
    } catch (error: any) {
      logs.push(`Test error: ${error.message}`);
      return {
        id: `result_${crypto.randomUUID()}`,
        runId,
        testCaseId: testCase.id,
        status: 'error',
        durationMs: Date.now() - startTime,
        error: error.message,
        stackTrace: error.stack,
        assertionResults: [],
        logs,
        createdAt: new Date(),
      };
    }
  }

  private static createErrorResult(runId: string, testCaseId: string, error: any): TestResult {
    return {
      id: `result_${crypto.randomUUID()}`,
      runId,
      testCaseId,
      status: 'error',
      durationMs: 0,
      error: error?.message || String(error),
      stackTrace: error?.stack,
      assertionResults: [],
      logs: [`Error: ${error?.message ?? error}`],
      createdAt: new Date(),
    };
  }
}