import { BaseProvider } from "./BaseProvider";
import type { ModelRequest, ModelResponse } from "../types";

interface EmbedClient {
  embed(text: string): Promise<ModelResponse>;
}

export class EmbeddingProvider extends BaseProvider {
  constructor(private client: EmbedClient) {
    super();
  }
  async generate(request: ModelRequest): Promise<ModelResponse> {
    return this.client.embed(request.input.text);
  }
}