export type TestSuiteType = 'unit' | 'integration' | 'agent' | 'workflow' | 'performance' | 'e2e';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'error';
export type EvaluationMetric = 'relevance' | 'accuracy' | 'tool_usage' | 'safety' | 'latency' | 'cost';
export type MockType = 'llm_response' | 'api_response' | 'database' | 'tool_execution';

export interface ExpectedToolCall {
  toolName: string;
  args?: Record<string, any>;
  callCount?: number;
}

export interface TestAssertion {
  type: 'equals' | 'contains' | 'regex' | 'schema' | 'llm_judge' | 'custom';
  field?: string;
  value?: any;
  message?: string;
}

export interface MockConfig {
  id: string;
  type: MockType;
  targetName: string;
  response: any;
  delayMs?: number;
  error?: string;
  callLimit?: number;
  matchArgs?: boolean;
  args?: any;
}

export interface TestCase {
  id: string;
  suiteId: string;
  name: string;
  description?: string;
  input: any;
  expectedOutput?: any;
  expectedToolCalls?: ExpectedToolCall[];
  assertions: TestAssertion[];
  mocks: MockConfig[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  isFlaky: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSuite {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: TestSuiteType;
  tags: string[];
  testCases: TestCase[];
  setupScript?: string;
  teardownScript?: string;
  parallelExecution: boolean;
  timeoutMs: number;
  retryCount: number;
  createdBy: string;
  lastRunAt?: Date;
  lastRunStatus?: TestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssertionResult {
  assertion: TestAssertion;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export interface TestResult {
  id: string;
  runId: string;
  testCaseId: string;
  status: TestStatus;
  durationMs: number;
  actualOutput?: any;
  actualToolCalls?: any[];
  assertionResults: AssertionResult[];
  error?: string;
  stackTrace?: string;
  logs: string[];
  createdAt: Date;
}

export interface TestRun {
  id: string;
  suiteId: string;
  tenantId: string;
  triggeredBy: string;
  environment: 'development' | 'staging' | 'production';
  status: TestStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  results: TestResult[];
  commitHash?: string;
  branch?: string;
  createdAt: Date;
}

export interface AgentEvaluation {
  id: string;
  testCaseId: string;
  runId: string;
  metrics: Record<EvaluationMetric, number>;
  overallScore: number;
  judgeModel: string;
  judgeReasoning: string;
  expectedOutput?: any;
  actualOutput?: any;
  createdAt: Date;
}

export interface GoldenDatasetEntry {
  id: string;
  datasetId: string;
  input: string;
  expectedOutput?: string;
  expectedToolCalls?: ExpectedToolCall[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

export interface GoldenDataset {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  entries: GoldenDatasetEntry[];
  entryCount: number;
  lastEvaluatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestReport {
  id: string;
  runId: string;
  tenantId: string;
  summary: {
    totalSuites: number;
    totalTests: number;
    passRate: number;
    averageDuration: number;
  };
  byType: Record<string, { passed: number; failed: number; total: number }>;
  byPriority: Record<string, { passed: number; failed: number; total: number }>;
  failedTests: Array<{ suiteName: string; testName: string; error: string }>;
  slowestTests: Array<{ testName: string; durationMs: number }>;
  format: 'json' | 'html' | 'junit';
  fileUrl?: string;
  generatedAt: Date;
}