import type { ModelResponse } from "../types";

export class WhisperClient {
  constructor(private endpoint = import.meta.env.VITE_WHISPER_URL as string | undefined) {}

  async transcribe(audio: Uint8Array): Promise<ModelResponse> {
    if (!this.endpoint) return { success: true, output: { text: "" } };
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: audio.slice().buffer,
    });
    if (!res.ok) throw new Error(`Whisper failed: ${res.status}`);
    return { success: true, output: await res.json() };
  }
}