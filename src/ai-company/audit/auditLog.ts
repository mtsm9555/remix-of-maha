import { AuditEvent, AuditLevel } from "./auditTypes";

export class AuditLog {
  private events: Map<string, AuditEvent> = new Map();

  recordEvent(
    id: string,
    source: string,
    action: string,
    message: string,
    level: AuditLevel = "info",
    targetId?: string
  ): AuditEvent {
    const event: AuditEvent = {
      id,
      source,
      action,
      targetId,
      level,
      message,
      createdAt: new Date().toISOString(),
    };

    this.events.set(id, event);
    return event;
  }

  getEvent(id: string): AuditEvent | undefined {
    return this.events.get(id);
  }

  getAllEvents(): AuditEvent[] {
    return Array.from(this.events.values());
  }

  getEventsBySource(source: string): AuditEvent[] {
    return this.getAllEvents().filter((e) => e.source === source);
  }

  getEventsByLevel(level: AuditLevel): AuditEvent[] {
    return this.getAllEvents().filter((e) => e.level === level);
  }

  clearAll(): number {
    const count = this.events.size;
    this.events.clear();
    return count;
  }
}