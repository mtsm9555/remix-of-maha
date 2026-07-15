import type { ModelResponse } from "../types";

export class KokoroClient {
  constructor(private endpoint = import.meta.env.VITE_KOKORO_URL as string | undefined) {}

  async speak(text: string): Promise<ModelResponse> {
    if (!this.endpoint) return { success: true, output: { audioUrl: "" } };
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Kokoro failed: ${res.status}`);
    return { success: true, output: await res.json() };
  }
}