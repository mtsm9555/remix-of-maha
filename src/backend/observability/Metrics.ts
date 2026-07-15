export class Metrics {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();

  increment(metric: string, by = 1) {
    this.counters.set(metric, (this.counters.get(metric) ?? 0) + by);
  }

  gauge(metric: string, value: number) {
    this.gauges.set(metric, value);
  }

  get(metric: string) {
    return this.counters.get(metric) ?? 0;
  }

  snapshot(): Record<string, number> {
    return { ...Object.fromEntries(this.counters), ...Object.fromEntries(this.gauges) };
  }
}

export const metrics = new Metrics();