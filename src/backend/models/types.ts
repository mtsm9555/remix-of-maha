export type ModelType = "chat" | "vision" | "embedding" | "stt" | "tts";

export interface ModelRequest {
  model: string;
  type: ModelType;
  input: any;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface ModelResponse {
  success: boolean;
  output: any;
  usage?: {
    tokens?: number;
    durationMs?: number;
  };
}