import type { TranscriptResult } from "../types";

export class WhisperService {
  constructor(private endpoint = import.meta.env.VITE_WHISPER_URL as string | undefined) {}

  async transcribe(audio: Uint8Array): Promise<TranscriptResult> {
    if (!this.endpoint) {
      return { text: "", confidence: 0 };
    }
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: audio,
    });
    if (!res.ok) throw new Error(`Whisper failed: ${res.status}`);
    const data = (await res.json()) as Partial<TranscriptResult>;
    return { text: data.text ?? "", confidence: data.confidence ?? 1 };
  }
}