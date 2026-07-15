export class PrometheusExporter {
  export(metrics: Record<string, number>) {
    return Object.entries(metrics)
      .map(([k, v]) => `${k} ${v}`)
      .join("\n");
  }
}