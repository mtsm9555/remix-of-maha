// src/lib/system/eventBus.ts

type EventPayload = Record<string, any>;

export type MahaEvent =
  | "voice:start"
  | "voice:end"
  | "agent:start"
  | "agent:end"
  | "tool:start"
  | "tool:end"
  | "memory:search"
  | "memory:write"
  | "thinking:start"
  | "thinking:end";

type Listener = (payload?: EventPayload) => void;

class MahaEventBus {
  private listeners = new Map<MahaEvent, Set<Listener>>();

  on(event: MahaEvent, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  emit(event: MahaEvent, payload?: EventPayload) {
    this.listeners.get(event)?.forEach((listener) => {
      listener(payload);
    });
  }
}

export const mahaBus = new MahaEventBus();