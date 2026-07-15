import type { ScreenAnalysis } from "../types";

export class UIElementExtractor {
  async extract(screenData: ScreenAnalysis) {
    return {
      buttons: screenData.buttons,
      forms: screenData.forms,
      links: [] as string[],
    };
  }
}