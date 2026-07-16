// src/tests/utils/mocks.ts
import { vi } from 'vitest';
import { z } from 'zod';
import type { ToolDefinition } from '@/backend/tools/types';
import type { AuthContext, UserRole } from '@/backend/auth/types';
import type { AgentEvent } from '@/backend/events/types';
import { AgentChannel, EventType } from '@/backend/events/types';

// Mock Supabase client
export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockReturnThis(),
  then: vi.fn((resolve) => resolve({ data: [], error: null }))
};

// Mock Model Server
export const mockModelServer = {
  generate: vi.fn().mockResolvedValue({
    content: 'Mock LLM response',
    toolCalls: [],
    usage: { promptTokens: 100, completionTokens: 50 }
  }),
  embed: vi.fn().mockResolvedValue(new Array(1536).fill(0.1))
};

// Mock Redis
export const mockRedis = {
  ping: vi.fn().mockResolvedValue('PONG'),
  quit: vi.fn().mockResolvedValue(undefined),
  on: vi.fn()
};

// Mock BullMQ
export const mockQueue = {
  add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
  getWaitingCount: vi.fn().mockResolvedValue(0),
  getActiveCount: vi.fn().mockResolvedValue(0),
  getCompletedCount: vi.fn().mockResolvedValue(0),
  getFailedCount: vi.fn().mockResolvedValue(0),
  close: vi.fn().mockResolvedValue(undefined)
};

export const mockWorker = {
  on: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined)
};

// Test data factories
export const TestDataFactory = {
  createUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
    permissions: ['tool:execute:*'],
    createdAt: new Date(),
    ...overrides
  }),

  createAuthContext: (overrides: Partial<AuthContext> = {}): AuthContext => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    role: 'user' as UserRole,
    permissions: ['tool:execute:*'],
    ...overrides
  }),

  createToolDefinition: (name = 'test_tool', overrides: Partial<ToolDefinition> = {}): ToolDefinition => ({
    name,
    description: 'Test tool description',
    parameters: z.object({}).passthrough(),
    execute: vi.fn().mockResolvedValue({ success: true, data: {}, executionTimeMs: 0 }),
    requiresAuth: false,
    ...overrides
  }),

  createWorkflowDefinition: (overrides = {}) => ({
    id: 'test-workflow-id',
    name: 'Test Workflow',
    description: 'Test workflow description',
    nodes: [
      { id: 'node1', name: 'Start', type: 'tool_call', config: {} }
    ],
    edges: [],
    ...overrides
  }),

  createAgentEvent: (overrides: Partial<AgentEvent> = {}): AgentEvent => ({
    id: 'test-event-id',
    type: EventType.TASK_COMPLETED,
    channel: AgentChannel.SYSTEM,
    payload: { message: 'Test event' },
    timestamp: new Date(),
    correlationId: 'test-correlation-id',
    sourceAgent: 'TestAgent',
    ...overrides
  })
};