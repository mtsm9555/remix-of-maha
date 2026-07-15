import type { ModelResponse } from "../types";

export class QwenClient {
  constructor(private endpoint = import.meta.env.VITE_QWEN_URL as string | undefined) {}

  async analyze(image: string, prompt: string): Promise<ModelResponse> {
    if (!this.endpoint) return { success: true, output: { text: "" } };
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, prompt }),
    });
    if (!res.ok) throw new Error(`Qwen failed: ${res.status}`);
    return { success: true, output: await res.json() };
  }
}