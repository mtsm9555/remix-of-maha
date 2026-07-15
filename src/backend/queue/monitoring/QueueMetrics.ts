export class QueueMetrics {
  async track(jobName: string, duration: number) {
    console.log({ jobName, duration, timestamp: new Date() });
  }
}