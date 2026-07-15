import { BaseProvider } from "./BaseProvider";
import type { ModelRequest, ModelResponse } from "../types";

interface ChatClient {
  chat(input: any): Promise<ModelResponse>;
}

export class ChatProvider extends BaseProvider {
  constructor(private client: ChatClient) {
    super();
  }
  async generate(request: ModelRequest): Promise<ModelResponse> {
    return this.client.chat(request.input);
  }
}