import type { TranscriptResult } from "../types";

export class WhisperService {
  constructor(private endpoint = import.meta.env.VITE_WHISPER_URL as string | undefined) {}

  async transcribe(audio: Uint8Array): Promise<TranscriptResult> {
    if (!this.endpoint) {
      return { text: "", confidence: 0 };
    }
    // Copy into a fresh ArrayBuffer so the body type is unambiguously BodyInit
    // (Uint8Array<ArrayBufferLike> isn't assignable directly under strict lib).
    const body = audio.slice().buffer;
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body,
    });
    if (!res.ok) throw new Error(`Whisper failed: ${res.status}`);
    const data = (await res.json()) as Partial<TranscriptResult>;
    return { text: data.text ?? "", confidence: data.confidence ?? 1 };
  }
}