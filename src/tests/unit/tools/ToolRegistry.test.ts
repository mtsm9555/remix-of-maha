// src/tests/unit/tools/ToolRegistry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../../../backend/tools/ToolRegistry';
import { TestDataFactory } from '../../utils/mocks';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should register a tool successfully', () => {
    const tool = TestDataFactory.createToolDefinition('search_web');
    registry.register(tool);

    expect(registry.get('search_web')).toBeDefined();
    expect(registry.getAll()).toHaveLength(1);
  });

  it('should throw error when registering duplicate tool', () => {
    const tool = TestDataFactory.createToolDefinition('search_web');
    registry.register(tool);

    expect(() => registry.register(tool)).toThrow('already registered');
  });

  it('should return undefined for non-existent tool', () => {
    expect(registry.get('non_existent')).toBeUndefined();
  });

  it('should format tools for LLM correctly', () => {
    const tool = TestDataFactory.createToolDefinition('search_web');
    registry.register(tool);

    const specs = registry.getLLMToolSpecs();
    expect(specs).toHaveLength(1);
    expect(specs[0]).toHaveProperty('name', 'search_web');
    expect(specs[0]).toHaveProperty('description');
    expect(specs[0]).toHaveProperty('parameters');
  });
});