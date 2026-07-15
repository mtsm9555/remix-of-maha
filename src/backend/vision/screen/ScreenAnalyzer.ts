import type { ScreenAnalysis } from "../types";

export class ScreenAnalyzer {
  async analyze(ocrText: string): Promise<ScreenAnalysis> {
    return { buttons: [], forms: [], menus: [], text: ocrText };
  }
}