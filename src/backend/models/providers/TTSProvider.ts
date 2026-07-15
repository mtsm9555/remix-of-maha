import { BaseProvider } from "./BaseProvider";
import type { ModelRequest, ModelResponse } from "../types";

interface TTSClient {
  speak(text: string): Promise<ModelResponse>;
}

export class TTSProvider extends BaseProvider {
  constructor(private client: TTSClient) {
    super();
  }
  async generate(request: ModelRequest): Promise<ModelResponse> {
    return this.client.speak(request.input.text);
  }
}