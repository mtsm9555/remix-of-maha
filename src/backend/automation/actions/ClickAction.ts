import { PlaywrightWorker } from "../workers/PlaywrightWorker";

export class ClickAction {
  constructor(private worker: PlaywrightWorker) {}
  async execute(payload: { url: string; selector: string }) {
    return this.worker.click(payload.url, payload.selector);
  }
}