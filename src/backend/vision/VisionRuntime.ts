import { OCRService } from "./ocr/OCRService";
import { ObjectDetector } from "./detection/ObjectDetector";
import { ScreenAnalyzer } from "./screen/ScreenAnalyzer";
import { QwenVLClient } from "./llm/QwenVLClient";
import type { VisionResult } from "./types";

export class VisionRuntime {
  private ocr = new OCRService();
  private detector = new ObjectDetector();
  private screen = new ScreenAnalyzer();
  private qwen = new QwenVLClient();

  async process(imageUrl: string, prompt = "Analyze image"): Promise<VisionResult> {
    const text = await this.ocr.extractText(imageUrl);
    const objects = await this.detector.detect(imageUrl);
    const screen = await this.screen.analyze(text.text);
    const analysis = await this.qwen.analyze(imageUrl, prompt);
    return { text, objects, screen, analysis };
  }
}