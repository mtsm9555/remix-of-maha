// src/backend/tools/ToolMonitor.ts
import { ToolCall, ToolResult, ToolSchema } from "./types";
import { EventCollector } from "../observability/EventCollector";
import { Logger } from "../observability/Logger";

export interface ToolMetrics {
  tool: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
  lastCalledAt?: string;
}

export class ToolMonitor {
  private metrics = new Map<string, ToolMetrics>();
  private history: ToolResult[] = [];
  private maxHistory = 1000;
  private events = new EventCollector();
  private logger = new Logger();

  recordCall(call: ToolCall): void {
    this.events.add({
      type: "tool.call",
      tool: call.tool,
      callId: call.id,
      userId: call.userId,
    });
  }

  recordResult(result: ToolResult): void {
    this.history.push(result);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Update metrics
    const existing = this.metrics.get(result.tool) ?? {
      tool: result.tool,
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      avgDurationMs: 0,
    };

    existing.totalCalls += 1;
    if (result.success) {
      existing.successCount += 1;
    } else {
      existing.failureCount += 1;
    }

    // Rolling average duration
    existing.avgDurationMs =
      (existing.avgDurationMs * (existing.totalCalls - 1) + result.durationMs) /
      existing.totalCalls;
    existing.lastCalledAt = result.timestamp;

    this.metrics.set(result.tool, existing);

    // Log
    if (!result.success) {
      this.logger.warn(`Tool ${result.tool} failed`, {
        callId: result.callId,
        error: result.error,
        durationMs: result.durationMs,
      });
    } else {
      this.logger.info(`Tool ${result.tool} succeeded`, {
        callId: result.callId,
        durationMs: result.durationMs,
      });
    }

    this.events.add({
      type: "tool.result",
      tool: result.tool,
      callId: result.callId,
      success: result.success,
      durationMs: result.durationMs,
    });
  }

  getMetrics(tool?: string): ToolMetrics | ToolMetrics[] | null {
    if (tool) {
      return this.metrics.get(tool) ?? null;
    }
    return Array.from(this.metrics.values());
  }

  getHistory(tool?: string, limit = 100): ToolResult[] {
    let results = [...this.history];
    if (tool) {
      results = results.filter((r) => r.tool === tool);
    }
    return results.slice(-limit);
  }

  getEvents(): any[] {
    return this.events.all();
  }

  clearHistory(): void {
    this.history = [];
    this.metrics.clear();
    this.events.clear();
  }
}

export const toolMonitor = new ToolMonitor();
