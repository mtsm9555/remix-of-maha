export interface VoiceRequest {
  userId: string;
  audio: Uint8Array;
}

export interface VoiceResponse {
  text: string;
  audioUrl?: string;
}

export interface TranscriptResult {
  text: string;
  confidence: number;
}