import type { AgentEvent, AgentChannel, EventHandler, EventType } from "./types";
import { EventStore } from "./EventStore";

export class EventBus {
  private subscribers: Map<string, Map<string, EventHandler[]>> = new Map();
  private onEventPublished?: (event: AgentEvent) => void;

  constructor(onEventPublished?: (event: AgentEvent) => void) {
    this.onEventPublished = onEventPublished;
  }

  subscribe(channel: AgentChannel, eventType: EventType, handler: EventHandler) {
    if (!this.subscribers.has(channel)) this.subscribers.set(channel, new Map());
    const channelMap = this.subscribers.get(channel)!;
    if (!channelMap.has(eventType)) channelMap.set(eventType, []);
    channelMap.get(eventType)!.push(handler);
    console.log(`[EventBus] Subscribed to ${channel} :: ${eventType}`);
  }

  async publish(event: AgentEvent) {
    console.log(`[EventBus] Publishing ${event.type} on ${event.channel}`);

    if (this.onEventPublished) {
      try {
        this.onEventPublished(event);
      } catch (err) {
        console.error("[EventBus] onEventPublished hook failed:", err);
      }
    }

    const channelMap = this.subscribers.get(event.channel);
    if (!channelMap) return;

    const handlers = channelMap.get(event.type) || [];
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`[EventBus] Handler failed for ${event.type}:`, error);
        }
      }),
    );
  }
}

export const globalEventBus = new EventBus((event) => {
  void EventStore.logEvent(event);
});