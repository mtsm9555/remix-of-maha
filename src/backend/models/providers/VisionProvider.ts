import { BaseProvider } from "./BaseProvider";
import type { ModelRequest, ModelResponse } from "../types";

interface VisionClient {
  analyze(image: string, prompt: string): Promise<ModelResponse>;
}

export class VisionProvider extends BaseProvider {
  constructor(private client: VisionClient) {
    super();
  }
  async generate(request: ModelRequest): Promise<ModelResponse> {
    return this.client.analyze(request.input.image, request.input.prompt);
  }
}