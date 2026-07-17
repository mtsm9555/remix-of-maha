import type { WorkflowUtils } from "./WorkflowSDKTypes";

export class WorkflowUtilsImpl implements WorkflowUtils {
  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async retry<T>(fn: () => Promise<T>, maxRetries: number = 3, delayMs: number = 1000): Promise<T> {
    let lastError: Error = new Error('Retry failed');
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          await this.delay(delayMs * Math.pow(2, attempt));
        }
      }
    }
    throw lastError;
  }

  async parallel<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return await Promise.all(tasks.map((task) => task()));
  }

  transform(data: any, transformer: (data: any) => any): any {
    return transformer(data);
  }
}