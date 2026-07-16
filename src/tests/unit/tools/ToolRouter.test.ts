// src/tests/unit/tools/ToolRouter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolRouter } from '../../../backend/tools/ToolRouter';
import { globalToolRegistry } from '../../../backend/tools/ToolRegistry';
import { TestDataFactory } from '../../utils/mocks';

describe('ToolRouter', () => {
  let router: ToolRouter;

  beforeEach(() => {
    router = new ToolRouter();
    vi.clearAllMocks();
  });

  it('should route tool call successfully', async () => {
    const tool = TestDataFactory.createToolDefinition('test_tool');
    globalToolRegistry.register(tool);

    const context = TestDataFactory.createAuthContext();
    const toolContext = {
      userId: context.userId,
      sessionId: context.sessionId,
      agentName: 'TestAgent',
      supabaseClient: {}
    };

    const result = await router.route('test_tool', {}, toolContext, context);

    expect(result.success).toBe(true);
    expect(tool.execute).toHaveBeenCalled();
  });

  it('should return error for non-existent tool', async () => {
    const context = TestDataFactory.createAuthContext();
    const toolContext = {
      userId: context.userId,
      sessionId: context.sessionId,
      agentName: 'TestAgent',
      supabaseClient: {}
    };

    const result = await router.route('non_existent', {}, toolContext, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});