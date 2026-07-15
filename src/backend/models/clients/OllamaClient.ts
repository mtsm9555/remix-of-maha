import type { ModelResponse } from "../types";

export class OllamaClient {
  constructor(private endpoint = import.meta.env.VITE_OLLAMA_URL as string | undefined) {}

  async chat(prompt: string): Promise<ModelResponse> {
    if (!this.endpoint) return { success: true, output: { text: "" } };
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "qwen3:latest", prompt }),
    });
    if (!res.ok) throw new Error(`Ollama failed: ${res.status}`);
    return { success: true, output: await res.json() };
  }
}