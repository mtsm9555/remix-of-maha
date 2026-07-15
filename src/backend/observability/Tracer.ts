export interface Span {
  traceId: string;
  name: string;
  finish(): { traceId: string; name: string; duration: number };
}

export class Tracer {
  startSpan(name: string): Span {
    const traceId = crypto.randomUUID();
    const startedAt = Date.now();
    return {
      traceId,
      name,
      finish() {
        return { traceId, name, duration: Date.now() - startedAt };
      },
    };
  }
}

export const tracer = new Tracer();