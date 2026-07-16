// src/tests/unit/events/EventBus.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../../../backend/events/EventBus';
import { AgentChannel, EventType } from '../../../backend/events/types';
import { TestDataFactory } from '../../utils/mocks';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    vi.clearAllMocks();
  });

  it('should subscribe to events', () => {
    const handler = vi.fn();
    eventBus.subscribe(AgentChannel.SYSTEM, EventType.TASK_COMPLETED, handler);

    // No error means success
    expect(true).toBe(true);
  });

  it('should publish events to subscribers', async () => {
    const handler = vi.fn();
    eventBus.subscribe(AgentChannel.SYSTEM, EventType.TASK_COMPLETED, handler);

    const event = TestDataFactory.createAgentEvent({
      type: EventType.TASK_COMPLETED,
      channel: AgentChannel.SYSTEM
    });

    await eventBus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should not call handlers for different event types', async () => {
    const handler = vi.fn();
    eventBus.subscribe(AgentChannel.SYSTEM, EventType.TASK_COMPLETED, handler);

    const event = TestDataFactory.createAgentEvent({
      type: EventType.TOOL_EXECUTED,
      channel: AgentChannel.SYSTEM
    });

    await eventBus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple subscribers', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus.subscribe(AgentChannel.SYSTEM, EventType.TASK_COMPLETED, handler1);
    eventBus.subscribe(AgentChannel.SYSTEM, EventType.TASK_COMPLETED, handler2);

    const event = TestDataFactory.createAgentEvent({
      type: EventType.TASK_COMPLETED,
      channel: AgentChannel.SYSTEM
    });

    await eventBus.publish(event);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should call onEventPublished callback', async () => {
    const onPublished = vi.fn();
    const bus = new EventBus(onPublished);

    const event = TestDataFactory.createAgentEvent();
    await bus.publish(event);

    expect(onPublished).toHaveBeenCalledWith(event);
  });
});