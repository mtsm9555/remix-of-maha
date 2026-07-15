import { BrowserManager, type BrowserLike } from "./BrowserManager";

export class BrowserPool {
  private pool: BrowserManager[] = [];

  constructor(private size = 2) {
    for (let i = 0; i < size; i++) this.pool.push(new BrowserManager());
  }

  async acquire(): Promise<BrowserLike> {
    const mgr = this.pool[Math.floor(Math.random() * this.pool.length)];
    return mgr.getBrowser();
  }
}