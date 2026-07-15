export class ModelMetrics {
  record(model: string, duration: number, tokens: number) {
    console.log({ model, duration, tokens, timestamp: new Date() });
  }
}