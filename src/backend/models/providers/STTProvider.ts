import { BaseProvider } from "./BaseProvider";
import type { ModelRequest, ModelResponse } from "../types";

interface STTClient {
  transcribe(audio: Uint8Array): Promise<ModelResponse>;
}

export class STTProvider extends BaseProvider {
  constructor(private client: STTClient) {
    super();
  }
  async generate(request: ModelRequest): Promise<ModelResponse> {
    return this.client.transcribe(request.input.audio);
  }
}