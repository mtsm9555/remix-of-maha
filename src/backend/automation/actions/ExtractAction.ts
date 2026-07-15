import { PlaywrightWorker } from "../workers/PlaywrightWorker";

export class ExtractAction {
  constructor(private worker: PlaywrightWorker) {}
  async execute(payload: { url: string }) {
    return this.worker.extractText(payload.url);
  }
}