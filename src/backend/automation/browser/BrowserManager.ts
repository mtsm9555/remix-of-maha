// Browser-safe stub. Real Playwright driver is loaded server-side only.
export interface BrowserLike {
  newPage(): Promise<any>;
}

export class BrowserManager {
  private browser?: BrowserLike;

  async getBrowser(): Promise<BrowserLike> {
    if (!this.browser) {
      const pkg = "playwright";
      const mod: any = await import(/* @vite-ignore */ pkg).catch(() => null);
      if (mod?.chromium) {
        this.browser = await mod.chromium.launch({ headless: true });
      } else {
        this.browser = {
          async newPage() {
            return {
              async goto(_url: string) {},
              async title() {
                return "";
              },
              url() {
                return "";
              },
              async screenshot() {
                return new Uint8Array();
              },
              async textContent(_sel: string) {
                return "";
              },
            };
          },
        };
      }
    }
    return this.browser!;
  }
}