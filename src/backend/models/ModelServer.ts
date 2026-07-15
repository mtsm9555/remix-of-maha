import { ModelRouter } from "./ModelRouter";
import type { ModelRequest, ModelResponse } from "./types";
import { ModelMetrics } from "./monitoring/ModelMetrics";

export class ModelServer {
  private metrics = new ModelMetrics();

  constructor(private router: ModelRouter) {}

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const start = Date.now();
    const result = await this.router.route(request);
    this.metrics.record(request.model, Date.now() - start, result.usage?.tokens ?? 0);
    return result;
  }
}