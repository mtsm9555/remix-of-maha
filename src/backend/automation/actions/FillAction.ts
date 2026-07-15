import { PlaywrightWorker } from "../workers/PlaywrightWorker";

export class FillAction {
  constructor(private worker: PlaywrightWorker) {}
  async execute(payload: { url: string; selector: string; value: string }) {
    return this.worker.fill(payload.url, payload.selector, payload.value);
  }
}