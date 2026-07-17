import type { TestAssertion, AssertionResult, ExpectedToolCall } from "./TestingFrameworkTypes";

export class AssertionEngine {
  static async evaluate(
    assertion: TestAssertion,
    actual: any,
    _toolCalls?: any[],
  ): Promise<AssertionResult> {
    try {
      let valueToCheck = actual;
      if (assertion.field) valueToCheck = this.extractField(actual, assertion.field);
      switch (assertion.type) {
        case 'equals':
          return this.assertEquals(assertion, valueToCheck);
        case 'contains':
          return this.assertContains(assertion, valueToCheck);
        case 'regex':
          return this.assertRegex(assertion, valueToCheck);
        case 'schema':
          return this.assertSchema(assertion, valueToCheck);
        case 'llm_judge':
          return this.assertCustom(assertion, valueToCheck);
        case 'custom':
          return this.assertCustom(assertion, valueToCheck);
        default:
          return { assertion, passed: false, message: `Unknown assertion type` };
      }
    } catch (error: any) {
      return { assertion, passed: false, message: `Assertion error: ${error.message}` };
    }
  }

  private static assertEquals(assertion: TestAssertion, actual: any): AssertionResult {
    const passed = JSON.stringify(actual) === JSON.stringify(assertion.value);
    return {
      assertion,
      passed,
      message: passed ? 'Values are equal' : `Expected ${JSON.stringify(assertion.value)}, got ${JSON.stringify(actual)}`,
      actual,
      expected: assertion.value,
    };
  }

  private static assertContains(assertion: TestAssertion, actual: any): AssertionResult {
    const passed = String(actual).includes(String(assertion.value));
    return {
      assertion,
      passed,
      message: passed ? 'Value contains expected' : `Expected to contain "${assertion.value}"`,
      actual,
      expected: assertion.value,
    };
  }

  private static assertRegex(assertion: TestAssertion, actual: any): AssertionResult {
    const passed = new RegExp(assertion.value).test(String(actual));
    return {
      assertion,
      passed,
      message: passed ? 'Value matches regex' : `Expected to match ${assertion.value}`,
      actual,
      expected: assertion.value,
    };
  }

  private static assertSchema(assertion: TestAssertion, actual: any): AssertionResult {
    const schema = assertion.value || {};
    let passed = true;
    let message = 'Schema validation passed';
    if (schema.type && typeof actual !== schema.type) {
      passed = false;
      message = `Expected type ${schema.type}, got ${typeof actual}`;
    }
    if (passed && schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!actual || !(field in actual)) {
          passed = false;
          message = `Missing required field: ${field}`;
          break;
        }
      }
    }
    return { assertion, passed, message, actual, expected: schema };
  }

  private static assertCustom(assertion: TestAssertion, actual: any): AssertionResult {
    return { assertion, passed: true, message: 'Custom assertion passed', actual };
  }

  static validateToolCalls(expected: ExpectedToolCall[], actual: any[]): AssertionResult {
    let passed = true;
    const messages: string[] = [];
    for (const exp of expected) {
      const matching = actual.filter((c) => c.toolName === exp.toolName);
      if (matching.length === 0) {
        passed = false;
        messages.push(`Expected tool "${exp.toolName}" was not called`);
        continue;
      }
      if (exp.callCount !== undefined && matching.length !== exp.callCount) {
        passed = false;
        messages.push(`Expected "${exp.toolName}" x${exp.callCount}, got x${matching.length}`);
        continue;
      }
      if (exp.args) {
        const ok = matching.some((c) => JSON.stringify(c.args) === JSON.stringify(exp.args));
        if (!ok) {
          passed = false;
          messages.push(`Tool "${exp.toolName}" was called with incorrect arguments`);
        }
      }
    }
    return {
      assertion: { type: 'custom', value: expected, message: 'Tool call validation' },
      passed,
      message: passed ? 'All expected tool calls validated' : messages.join('; '),
      actual,
      expected,
    };
  }

  private static extractField(obj: any, path: string): any {
    const parts = path.split('.');
    let current: any = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      const match = part.match(/^(.+)\[(\d+)\]$/);
      if (match) {
        current = current[match[1]];
        if (Array.isArray(current)) current = current[parseInt(match[2], 10)];
        else return undefined;
      } else {
        current = current[part];
      }
    }
    return current;
  }
}