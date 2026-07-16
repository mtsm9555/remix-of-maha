// src/tests/unit/context/ContextBuilder.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextBuilder } from '../../../backend/context/ContextBuilder';
import { ContextFetchers } from '../../../backend/context/ContextFetchers';
import { ContextRanker } from '../../../backend/context/ContextRanker';

describe('ContextBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build context with all sources', async () => {
    vi.spyOn(ContextFetchers, 'getRecentConversation').mockResolvedValue([
      { source: 'conversation', content: 'Recent message', relevanceScore: 0.9 }
    ]);
    vi.spyOn(ContextFetchers, 'getRelevantMemory').mockResolvedValue([
      { source: 'memory', content: 'Memory chunk', relevanceScore: 0.8 }
    ]);
    vi.spyOn(ContextFetchers, 'getGraphContext').mockResolvedValue([
      { source: 'knowledge_graph', content: 'Graph entity', relevanceScore: 0.7 }
    ]);

    const context = await ContextBuilder.build({
      userId: 'test-user',
      sessionId: 'test-session',
      currentQuery: 'What is Maha?'
    });

    expect(context.userId).toBe('test-user');
    expect(context.sessionId).toBe('test-session');
    expect(context.currentQuery).toBe('What is Maha?');
    expect(context.chunks).toHaveLength(3);
    expect(context.aggregatedContext).toContain('Recent message');
    expect(context.aggregatedContext).toContain('Memory chunk');
    expect(context.aggregatedContext).toContain('Graph entity');
  });

  it('should include tool results in context', async () => {
    vi.spyOn(ContextFetchers, 'getRecentConversation').mockResolvedValue([]);
    vi.spyOn(ContextFetchers, 'getRelevantMemory').mockResolvedValue([]);
    vi.spyOn(ContextFetchers, 'getGraphContext').mockResolvedValue([]);

    const context = await ContextBuilder.build({
      userId: 'test-user',
      sessionId: 'test-session',
      currentQuery: 'Search for Iron Man',
      toolResults: ['Tool result 1', 'Tool result 2']
    });

    expect(context.chunks).toHaveLength(2);
    expect(context.aggregatedContext).toContain('Tool result 1');
  });

  it('should estimate token count', async () => {
    vi.spyOn(ContextFetchers, 'getRecentConversation').mockResolvedValue([
      { source: 'conversation', content: 'Test message', relevanceScore: 0.9 }
    ]);
    vi.spyOn(ContextFetchers, 'getRelevantMemory').mockResolvedValue([]);
    vi.spyOn(ContextFetchers, 'getGraphContext').mockResolvedValue([]);

    const context = await ContextBuilder.build({
      userId: 'test-user',
      sessionId: 'test-session',
      currentQuery: 'Test query'
    });

    expect(context.tokenEstimate).toBeGreaterThan(0);
  });
});