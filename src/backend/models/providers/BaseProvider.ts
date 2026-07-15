import type { ModelRequest, ModelResponse } from "../types";

export abstract class BaseProvider {
  abstract generate(request: ModelRequest): Promise<ModelResponse>;
}