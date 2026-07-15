import { PlaywrightWorker } from "../workers/PlaywrightWorker";

export class OpenUrlAction {
  constructor(private worker: PlaywrightWorker) {}
  async execute(payload: { url: string }) {
    return this.worker.openUrl(payload.url);
  }
}