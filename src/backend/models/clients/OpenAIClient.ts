import type { ModelResponse } from "../types";

export class OpenAIClient {
  constructor(
    private endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions",
    private model = "google/gemini-3-flash-preview",
  ) {}

  async chat(input: { messages: Array<{ role: string; content: string }> }): Promise<ModelResponse> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, messages: input.messages }),
    });
    if (!res.ok) throw new Error(`OpenAI-compatible failed: ${res.status}`);
    return { success: true, output: await res.json() };
  }
}