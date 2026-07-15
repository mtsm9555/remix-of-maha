export interface CollectedEvent {
  [key: string]: any;
  timestamp?: Date;
}

export class EventCollector {
  private events: CollectedEvent[] = [];

  add(event: CollectedEvent) {
    this.events.push({ ...event, timestamp: new Date() });
  }

  all() {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}

export const events = new EventCollector();