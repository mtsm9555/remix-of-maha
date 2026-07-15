import { PlaywrightWorker } from "../workers/PlaywrightWorker";

export class SearchAction {
  constructor(private worker: PlaywrightWorker) {}
  async execute(payload: { query: string }) {
    const query = encodeURIComponent(payload.query);
    return this.worker.openUrl(`https://www.google.com/search?q=${query}`);
  }
}