import type { ModelRequest, ModelResponse } from "./types";
import { BaseProvider } from "./providers/BaseProvider";

export class ModelRouter {
  constructor(
    private chatProvider: BaseProvider,
    private visionProvider: BaseProvider,
    private embeddingProvider: BaseProvider,
    private sttProvider: BaseProvider,
    private ttsProvider: BaseProvider,
  ) {}

  async route(request: ModelRequest): Promise<ModelResponse> {
    switch (request.type) {
      case "chat":
        return this.chatProvider.generate(request);
      case "vision":
        return this.visionProvider.generate(request);
      case "embedding":
        return this.embeddingProvider.generate(request);
      case "stt":
        return this.sttProvider.generate(request);
      case "tts":
        return this.ttsProvider.generate(request);
      default:
        throw new Error("Unknown model type");
    }
  }
}