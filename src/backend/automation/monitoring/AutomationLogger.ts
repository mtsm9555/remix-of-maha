export class AutomationLogger {
  async log(task: unknown, result: unknown) {
    console.log({ task, result, timestamp: new Date() });
  }
}