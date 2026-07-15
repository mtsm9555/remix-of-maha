export class KokoroService {
  constructor(private endpoint = import.meta.env.VITE_KOKORO_URL as string | undefined) {}

  async synthesize(text: string): Promise<{ audioUrl?: string; audio?: ArrayBuffer }> {
    if (!this.endpoint) return {};
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Kokoro failed: ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      return (await res.json()) as { audioUrl?: string };
    }
    return { audio: await res.arrayBuffer() };
  }
}