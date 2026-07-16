import type { MahaTool } from "./MahaTool";
import type { ToolContext, ToolResult } from "./ToolSDKTypes";

export class ToolTestHarness {
  static async runTest<TArgs, TResult>(
    tool: MahaTool<TArgs, TResult>,
    mockArgs: TArgs,
    mockContextOverrides: Partial<ToolContext> = {},
  ): Promise<ToolResult<TResult>> {
    console.log(`\n🧪 [TestHarness] Testing tool: ${tool.name}`);
    console.log(`📥 Input:`, JSON.stringify(mockArgs, null, 2));

    const defaultContext: ToolContext = {
      agentId: "test_agent_01",
      sessionId: "test_session_99",
      department: "development",
      correlationId: "test_corr_123",
      budgetRemainingUSD: 100.0,
      ...mockContextOverrides,
    };

    const result = await tool.execute(mockArgs, defaultContext);
    console.log(`\n📤 Output:`);
    if (result.success) {
      console.log(`✅ Success!`);
      console.log(`Data:`, JSON.stringify(result.data, null, 2));
    } else {
      console.log(`❌ Failed!`);
      console.log(`Error:`, result.error);
    }
    console.log(`⏱️ Execution Time: ${result.metadata?.executionTimeMs}ms\n`);
    return result;
  }
}