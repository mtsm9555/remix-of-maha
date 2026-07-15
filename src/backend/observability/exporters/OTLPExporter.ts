export class OTLPExporter {
  constructor(private endpoint = import.meta.env.VITE_OTLP_URL as string | undefined) {}

  async send(kind: "logs" | "metrics" | "traces", batch: unknown) {
    if (!this.endpoint) return;
    const res = await fetch(`${this.endpoint}/v1/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`OTLP ${kind} failed: ${res.status}`);
  }
}