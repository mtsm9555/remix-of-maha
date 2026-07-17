import type { PluginEventSystem, PluginEventHandler } from "./PluginSDKTypes";

export class PluginEventSystemImpl implements PluginEventSystem {
  private handlers: Map<string, Set<PluginEventHandler>> = new Map();
  private onceHandlers: Map<string, Set<PluginEventHandler>> = new Map();

  on(event: string, handler: PluginEventHandler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: PluginEventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, data: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(data); } catch (e) { console.error(`[EventSystem] ${event}:`, e); }
      }
    }
    const onceHandlers = this.onceHandlers.get(event);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try { handler(data); } catch (e) { console.error(`[EventSystem] once ${event}:`, e); }
      }
      this.onceHandlers.delete(event);
    }
  }

  once(event: string, handler: PluginEventHandler): void {
    if (!this.onceHandlers.has(event)) this.onceHandlers.set(event, new Set());
    this.onceHandlers.get(event)!.add(handler);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
      this.onceHandlers.delete(event);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }
  }
}