import { PlaywrightWorker } from "../workers/PlaywrightWorker";

export class ScreenshotAction {
  constructor(private worker: PlaywrightWorker) {}
  async execute(payload: { url: string }) {
    return this.worker.screenshot(payload.url);
  }
}