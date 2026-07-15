import { BrowserManager } from "../browser/BrowserManager";

export class PlaywrightWorker {
  private browserManager = new BrowserManager();

  async openUrl(url: string) {
    const browser = await this.browserManager.getBrowser();
    const page = await browser.newPage();
    await page.goto(url);
    return { title: await page.title(), url: page.url() };
  }

  async screenshot(url: string) {
    const browser = await this.browserManager.getBrowser();
    const page = await browser.newPage();
    await page.goto(url);
    return page.screenshot();
  }

  async extractText(url: string) {
    const browser = await this.browserManager.getBrowser();
    const page = await browser.newPage();
    await page.goto(url);
    return page.textContent("body");
  }

  async click(url: string, selector: string) {
    const browser = await this.browserManager.getBrowser();
    const page = await browser.newPage();
    await page.goto(url);
    await page.click?.(selector);
  }

  async fill(url: string, selector: string, value: string) {
    const browser = await this.browserManager.getBrowser();
    const page = await browser.newPage();
    await page.goto(url);
    await page.fill?.(selector, value);
  }
}